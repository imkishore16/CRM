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
//           select: { modelProvider: true },  
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
import { fetchIndex } from "@/app/actions/pc";
import { 
  fetchEnhancedConversationHistory, 
  saveConversationToVecDb, 
  generateResponse, 
  similaritySearch,
  handleCampaignVariables
} from "@/lib/serverUtils";
import { addConversation } from "@/app/actions/prisma";

async function parseFormEncodedBody(req: NextRequest) {
  const rawBody = await req.text(); 
  return Object.fromEntries(new URLSearchParams(rawBody)); 
}
export async function POST(req: NextRequest) {
  try {
      const data = await parseFormEncodedBody(req); 
      const mobileNumber = data.From?.replace("whatsapp:", ""); 
      const query = data.Body;

      if (!query) {
          return NextResponse.json({ error: "Query is required" }, { status: 400 });
      }
      if (!mobileNumber) {
          return NextResponse.json({ error: "MobileNumber is required" }, { status: 400 });
      }

      const spaceCustomer = await prisma.spaceCustomer.findFirst({
          where: { mobileNumber: mobileNumber },
          select: { spaceId: true },
      });
      const spaceId = spaceCustomer?.spaceId ?? 0;

      await addConversation(spaceId, mobileNumber, query, "USER");

      const space = await prisma.space.findFirst({
          where: { id: spaceId },
          select: { modelProvider: true },
      });
      const llmProvider = space?.modelProvider ?? "gemini";
      const llm = getLLM(llmProvider);

      const index = await fetchIndex(spaceId);

      const pastConversations = await fetchEnhancedConversationHistory(query, mobileNumber, index, spaceId);
      const combinedConversations = pastConversations.join("\n");
      const relevantDocs = await similaritySearch(query, index);
      const campaignVariables = await handleCampaignVariables(index, spaceId);
      
      // Generate and save response
      const response = await generateResponse(llm, query, relevantDocs, combinedConversations, campaignVariables);
      await saveConversationToVecDb(llm, mobileNumber, query, response, index);
      await addConversation(spaceId, mobileNumber, response, "BOT");

      await twilioClient.messages.create({
          body: response,
          from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
          to: `whatsapp:${mobileNumber}`
      });

      return NextResponse.json({ message: response }, { status: 200 });

  } catch (error) {
      console.error("Error processing request:", error);
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

