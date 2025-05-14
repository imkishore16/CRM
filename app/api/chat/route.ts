// import { NextRequest, NextResponse } from "next/server";
// import pc from "@/clients/pinecone";
// import embeddingModel from "@/clients/embeddingModel";
// import prisma from "@/lib/db";
// import { ChatPromptTemplate } from "@langchain/core/prompts";
// import { StringOutputParser } from "@langchain/core/output_parsers";
// import redis from "@/clients/redis";
// import twilioClient from "@/clients/twilioClient";
// import { HumanMessage, SystemMessage } from "@langchain/core/messages";
// import { chatTemplate } from "@/constants/chatTemplate";
// import { getLLM } from "@/clients/llm";
// import { CampaignVariables } from "@/types";
// import { spawn } from "child_process";
// import { addMessageToRedis, processAggregatedMessages } from "@/lib/serverUtils";
// import { addConversation } from "@/app/actions/prisma";
// const DEBOUNCE_SECONDS = 2;
// const REDIS_MESSAGE_PREFIX = 'whatsapp:pending:';

// async function parseFormEncodedBody(req: NextRequest) {
//   const rawBody = await req.text(); 
//   return Object.fromEntries(new URLSearchParams(rawBody)); 
// }

// export async function POST(req: NextRequest) {
//     try {
      
//         const data = await parseFormEncodedBody(req); 
//         const mobileNumber = data.From?.replace("whatsapp:", ""); 
//         const query = data.Body;

//         if (!query) {
//             return NextResponse.json({ error: "Query is required" }, { status: 400 });
//         }
//         if (!mobileNumber) {
//             return NextResponse.json({ error: "MobileNumber is required" }, { status: 400 });
//         }

//         //TODO : move this to redis
//         const spaceCustomer = await prisma.spaceCustomer.findFirst({
//           where: { mobileNumber: mobileNumber },
//           select: { spaceId: true },
//         });

//       const spaceId = spaceCustomer?.spaceId ?? 0;

//       await addConversation(spaceId,mobileNumber,query,"USER")
      
//       // Create a unique key for this user based on spaceId and mobileNumber
//       const userKey = `${REDIS_MESSAGE_PREFIX}${spaceId}:${mobileNumber}`;
//       const processingKey = `${userKey}:processing`;

//       await addMessageToRedis(userKey, query);
//       const isProcessing = await redis.get(processingKey);
//       if (!isProcessing) {
//         await redis.set(processingKey, "true", "EX", DEBOUNCE_SECONDS);

//         // setTimeout(async () => {
//         //   const space = await prisma.space.findFirst({
//         //     where: { id: spaceId },
//         //     select: { modelProvider: true },
//         //   });
//         //   const llmKey = `${spaceId}:llm`;
//         //   let llmProvider: string | null = await redis.get(llmKey);
//         //   if (!llmProvider) {
//         //     llmProvider = space?.modelProvider ?? "gemini";
//         //     await redis.set(llmKey, llmProvider);
//         //   }

//         //   const llm = getLLM(llmProvider);
//         //   await processAggregatedMessages(llm,mobileNumber, spaceId);
//         // }, DEBOUNCE_SECONDS * 1000);
//         const space = await prisma.space.findFirst({
//           where: { id: spaceId },
//           select: { modelProvider: true ,userId: true},
//         });
      
//         const llmKey = `${spaceId}:llm`;
//         let llmProvider: string | null = await redis.get(llmKey);
//         if (!llmProvider) {
//             llmProvider = space?.modelProvider ?? "gemini";
//             await redis.set(llmKey, llmProvider);
//         }
        
//         const llm = getLLM(llmProvider);
      
//         // Process after debounce period
//         try {
//             await processAggregatedMessages(llm, mobileNumber, spaceId);
//         } finally {
//             // Cleanup processing flag in case of error
//             await redis.del(processingKey);
//         }
        
//     }

//         return NextResponse.json({ message: "response" }, { status: 200 });

//     } catch (error) {
//         console.error("Error processing request:", error);
//         return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
//     }
// }



import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import twilioClient from "@/clients/twilioClient";
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
import { parseToolCalls, handleToolCall } from '@/lib/toolParser';

async function parseFormEncodedBody(req: NextRequest) {
  const rawBody = await req.text(); 
  return Object.fromEntries(new URLSearchParams(rawBody)); 
}
export async function POST(req: NextRequest) {
  try {
      const data = await parseFormEncodedBody(req); 
      let mobileNumber = data.From?.replace("whatsapp:", "") || "";
      const query = data.Body;

      if (!query) {
          return NextResponse.json({ error: "Query is required" }, { status: 400 });
      }
      if (!mobileNumber) {
          return NextResponse.json({ error: "MobileNumber is required" }, { status: 400 });
      }

        // Remove the leading "+" if present
        if (mobileNumber.startsWith("+")) {
        mobileNumber = mobileNumber.substring(1);
        }

        // For Indian numbers specifically, remove the country code
        if (mobileNumber.startsWith("91") && mobileNumber.length > 10) {
        mobileNumber = mobileNumber.substring(2);
        }
      console.log("mobileNumber",mobileNumber)
      const spaceCustomer = await prisma.spaceCustomer.findFirst({
          where: { mobileNumber: mobileNumber },
          select: { spaceId: true },
      });
      console.log("spaceCustomer",spaceCustomer)
      const spaceId = spaceCustomer?.spaceId ?? 0;
      

      await addConversation(spaceId, mobileNumber, query, "USER");

      const space = await prisma.space.findFirst({
          where: { id: spaceId },
          select: { modelProvider: true ,userId: true},
      });
      const llmProvider = space?.modelProvider ?? "gemini";
      const llm = getLLM(llmProvider);

      const index = await fetchIndex(spaceId);

      const pastConversations = await fetchEnhancedConversationHistory(query, mobileNumber, index, spaceId);
      const combinedConversations = pastConversations.join("\n");
      const relevantDocs = await similaritySearch(query, index);
      const campaignVariables = await handleCampaignVariables(index, spaceId);
      const customerData = await fetchCustomerData(index, mobileNumber);
      const productLinks = await fetchProductLinks(index);
      // Generate and save response
      let response = await generateResponse(llm, query, relevantDocs, customerData,productLinks, combinedConversations, campaignVariables);
      await saveConversationToVecDb(llm, mobileNumber, query, response, index);
      await addConversation(spaceId, mobileNumber, response, "BOT");

      await twilioClient.messages.create({
          body: response,
          from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
          to: `whatsapp:${mobileNumber}`
      });

      const toolCalls = parseToolCalls(response);

    for (const toolCall of toolCalls) {
    try {
        const originalToolCallRegex = new RegExp(`\\[TOOL_CALL:\\s*${toolCall.tool}\\(.*?\\)\\]`);
        const match = originalToolCallRegex.exec(response);
        
        if (!match) {
            console.error(`Could not find original tool call for ${toolCall.tool} in response`);
            continue;
        }
        
        const originalToolCallText = match[0];
        let toolResponse;

        if (toolCall.tool === 'save_customer_data' && toolCall.parameters.data) {
            // Add mobile number to the customer data
            const customerData = {
                ...(typeof toolCall.parameters.data === 'object' ? toolCall.parameters.data : {}),
                mobile_number: mobileNumber
            };
            const index = await fetchIndex(spaceId);
            toolResponse = await saveCustomerData(index, customerData);
            toolResponse = toolResponse ? 
                "I've noted down your information. This helps me provide more personalized assistance." :
                "I wasn't able to save your information at the moment, but I can still help you.";
        } else {
            toolResponse = await handleToolCall(toolCall, space?.userId?.toString() ?? "0");
        }
        
        // Replace the exact original text
        response = response.replace(originalToolCallText, toolResponse);
    } catch (error) {
        console.error(`Error handling tool call ${toolCall.tool}:`, error);
        
        const originalToolCallRegex = new RegExp(`\\[TOOL_CALL:\\s*${toolCall.tool}\\(.*?\\)\\]`);
        const match = originalToolCallRegex.exec(response);
        
        if (match) {
            response = response.replace(
                match[0],
                toolCall.tool === 'save_customer_data' ?
                    "I wasn't able to save your information at the moment, but I can still help you." :
                    "Sorry, I couldn't schedule the meeting. Please try again."
            );
        }
    }
}

      return NextResponse.json({ message: response }, { status: 200 });

  } catch (error) {
      console.error("Error processing request:", error);
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

