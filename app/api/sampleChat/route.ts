import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getLLM } from "@/clients/llm";
import { fetchCustomerData, fetchIndex, fetchProductLinks, saveCustomerData } from "@/app/actions/pc";
import { 
  fetchEnhancedConversationHistory, 
  saveConversationToVecDb, 
  generateResponse, 
  similaritySearch,
  handleCampaignVariables
} from "@/lib/serverUtils";
import { addConversation } from "@/app/actions/prisma";
import { parseToolCalls, handleToolCall } from "@/lib/toolParser";
import { detectPersonalInfo } from "@/lib/personalInfoDetector";
import { savePersonalInfoToVecDb } from "@/lib/personalInfoStorage";
import { addMessageToRedis } from "@/lib/serverUtils";
import redis from "@/clients/redis";

interface ChatRequest {
  query: string;
  mobileNumber: string;
}

const DEBOUNCE_SECONDS = 4;
const REDIS_MESSAGE_PREFIX = 'whatsapp:pending:';

export async function POST(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const spaceId = parseInt(searchParams.get("spaceId") ?? "0")
        const data = await req.json();
        const query = data.query as string;
        const mobileNumber = data.mobileNumber || "1234567890"

        if (!query || !mobileNumber) {
            return NextResponse.json({ error: "Query and mobileNumber are required" }, { status: 400 });
        }

        const userKey = `${REDIS_MESSAGE_PREFIX}${spaceId}:${mobileNumber}`;
        const debounceKey = `${userKey}:debounce`;

        // Add message to queue
        await addMessageToRedis(userKey, query);

        // Check if we're in debounce period
        const isDebouncing = await redis.get(debounceKey);
        if (isDebouncing) {
            return NextResponse.json({ message: "" }, { status: 200 });
        }

        // Set debounce lock with expiration
        await redis.set(debounceKey, "true", "EX", DEBOUNCE_SECONDS);

        // Wait for debounce period
        await new Promise(resolve => setTimeout(resolve, DEBOUNCE_SECONDS * 1000));

        const space = await prisma.space.findFirst({
            where: { id: spaceId },
            select: { modelProvider: true },
        });

        const model = getLLM(space?.modelProvider ?? "gemini");

        try {
            const response = await processAggregatedMessages(model, mobileNumber, spaceId, userKey);
            return NextResponse.json({ message: response }, { status: 200 });
        } finally {
            // Ensure debounce key is cleared even if processing fails
            await redis.del(debounceKey);
        }
    } catch (error) {
        console.error("Error processing request:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

async function processAggregatedMessages(model:any , mobileNumber: string, spaceId: number , userKey:string): Promise<string> {
  const processingKey = `${userKey}:processing`;

  try {
      const messageItems = await redis.lrange(userKey, 0, -1);

      if (messageItems.length === 0) {
          return "";
      }

      const messages = messageItems.map(item => JSON.parse(item).message);
      const combinedQuery = messages.join(" ");

      const personalInfo = await detectPersonalInfo(combinedQuery);
      if (personalInfo) {
          // Store personal info in separate vector DB
          const personalInfoIndex = await fetchIndex(spaceId, "customerdata"); 
          await savePersonalInfoToVecDb(model, mobileNumber, personalInfo, personalInfoIndex);
      }
      
      await addConversation(spaceId,mobileNumber,combinedQuery,"USER")

      console.log(`Processing aggregated messages for ${mobileNumber}:`, combinedQuery);

      const index = await fetchIndex(spaceId)
      console.log("starting")
      const pastConversations = await fetchEnhancedConversationHistory(combinedQuery, mobileNumber, index,spaceId);
      console.log("Fetched past conversations")
      const combinedConversations = pastConversations.join("\n");
      console.log("fetched combined conversations")
      const relevantDocs = await similaritySearch(combinedQuery, index);
      console.log("fetched relevant docs")
      const campaignVariables = await handleCampaignVariables(index, spaceId);
      console.log("fetched campaign variables")
      const customerData = await fetchCustomerData(index,mobileNumber)
      const productLinks = await fetchProductLinks(index)
      let response = await generateResponse(model,combinedQuery, relevantDocs, customerData,productLinks, combinedConversations, campaignVariables,);
      console.log("generated response")

      const toolCalls = parseToolCalls(response);
      for (const toolCall of toolCalls) {
          try {
              const originalToolCallRegex = new RegExp(`\\[TOOL_CALL:\\s*${toolCall.tool}\\(.*?\\)\\]`);
              const match = originalToolCallRegex.exec(response);

              if (!match) {
                  console.error(`Could not find original tool call for ${toolCall.tool} in response`);
                  continue;
              }

              const space = await prisma.space.findFirst({
                  where: { id: spaceId },
                  select: { userId: true },
              });

              const originalToolCallText = match[0];
              const toolResponse = await handleToolCall(toolCall, space?.userId?.toString() ?? "0");

              // Replace the exact original text
              response = response.replace(originalToolCallText, toolResponse);
          } catch (error) {
              console.error(`Error handling tool call ${toolCall.tool}:`, error);

              const originalToolCallRegex = new RegExp(`\\[TOOL_CALL:\\s*${toolCall.tool}\\(.*?\\)\\]`);
              const match = originalToolCallRegex.exec(response);

              if (match) {
                  response = response.replace(
                      match[0],
                      "Sorry, I couldn't schedule the meeting. Please try again."
                  );
              }
          }
      }

      await saveConversationToVecDb(model,mobileNumber, combinedQuery, response, index);
      await addConversation(spaceId,mobileNumber,response,"BOT")


      await redis.del(userKey);
      await redis.del(processingKey);
      return response
  } catch (error) {
      console.error(`Error processing messages for ${mobileNumber}:`, error);
      await redis.del(processingKey);
      return "Something went wrong "
  }
}


