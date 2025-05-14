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

        if (mobileNumber.startsWith("+")) {
        mobileNumber = mobileNumber.substring(1);
        }

        if (mobileNumber.startsWith("91") && mobileNumber.length > 10) {
        mobileNumber = mobileNumber.substring(2);
        }
      console.log("mobileNumber",mobileNumber)
      const [spaceCustomer, index] = await Promise.all([
        prisma.spaceCustomer.findFirst({
          where: { mobileNumber: mobileNumber },
          select: { spaceId: true },
        }),
        fetchIndex(0) // Using 0 as default since we don't have spaceId yet
      ]);
      console.log("spaceCustomer",spaceCustomer)
      const spaceId = spaceCustomer?.spaceId ?? 0;
      const finalIndex = spaceId !== 0 ? await fetchIndex(spaceId) : index;

      await addConversation(spaceId, mobileNumber, query, "USER");

    //   const [space, realIndex] = await Promise.all([
    //     prisma.space.findFirst({
    //       where: { id: spaceId },
    //       select: { modelProvider: true, userId: true },
    //     }),
    //     // Ensure we have the correct index
    //     spaceId !== 0 && finalIndex.namespace !== `campaign-${spaceId}` ? fetchIndex(spaceId) : Promise.resolve(finalIndex)
    //   ]);
    const space = await prisma.space.findFirst({
        where: { id: spaceId },
        select: { modelProvider: true ,userId: true},
    });
    const realIndex = finalIndex;
      const llmProvider = space?.modelProvider ?? "gemini";
      const llm = getLLM(llmProvider);


      const [
        pastConversations,
        relevantDocs,
        campaignVariables,
        customerData,
        productLinks
      ] = await Promise.all([
        fetchEnhancedConversationHistory(query, mobileNumber, realIndex, spaceId),
        similaritySearch(query, realIndex),
        handleCampaignVariables(realIndex, spaceId),
        fetchCustomerData(realIndex, mobileNumber),
        fetchProductLinks(realIndex)
      ]);

      const combinedConversations = pastConversations.join("\n");
      // Generate and save response
      let response = await generateResponse(
        llm, 
        query, 
        relevantDocs, 
        customerData, 
        productLinks, 
        combinedConversations, 
        campaignVariables
      );

      const toolCalls = parseToolCalls(response);

//     for (const toolCall of toolCalls) {
//     try {
//         const originalToolCallRegex = new RegExp(`\\[TOOL_CALL:\\s*${toolCall.tool}\\(.*?\\)\\]`);
//         const match = originalToolCallRegex.exec(response);
        
//         if (!match) {
//             console.error(`Could not find original tool call for ${toolCall.tool} in response`);
//             continue;
//         }
        
//         const originalToolCallText = match[0];
//         let toolResponse;

//         if (toolCall.tool === 'save_customer_data' && toolCall.parameters.data) {
//             // Add mobile number to the customer data
//             const customerData = {
//                 ...(typeof toolCall.parameters.data === 'object' ? toolCall.parameters.data : {}),
//                 mobile_number: mobileNumber
//             };
//             const index = await fetchIndex(spaceId);
//             toolResponse = await saveCustomerData(index, customerData);
//             toolResponse = toolResponse ? 
//                 "I've noted down your information. This helps me provide more personalized assistance." :
//                 "I wasn't able to save your information at the moment, but I can still help you.";
//         } else {
//             toolResponse = await handleToolCall(toolCall, space?.userId?.toString() ?? "0");
//         }
        
//         // Replace the exact original text
//         response = response.replace(originalToolCallText, toolResponse);
//     } catch (error) {
//         console.error(`Error handling tool call ${toolCall.tool}:`, error);
        
//         const originalToolCallRegex = new RegExp(`\\[TOOL_CALL:\\s*${toolCall.tool}\\(.*?\\)\\]`);
//         const match = originalToolCallRegex.exec(response);
        
//         if (match) {
//             response = response.replace(
//                 match[0],
//                 toolCall.tool === 'save_customer_data' ?
//                     "I wasn't able to save your information at the moment, but I can still help you." :
//                     "Sorry, I couldn't schedule the meeting. Please try again."
//             );
//         }
//     }
// }

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
         // Save conversation and send WhatsApp message in parallel
      await Promise.all([
        saveConversationToVecDb(llm, mobileNumber, query, response, realIndex),
        addConversation(spaceId, mobileNumber, response, "BOT"),
        twilioClient.messages.create({
            body: response,
            from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
            to: `whatsapp:+91${mobileNumber}`
          })
      ]);


      return NextResponse.json({ message: response }, { status: 200 });

  } catch (error) {
      console.error("Error processing request:", error);
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

