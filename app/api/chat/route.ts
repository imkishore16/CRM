
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
  handleCampaignVariables,
  
} from "@/lib/serverUtils";
import { addConversation,getMeetingsByUser } from "@/app/actions/prisma";
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
        productLinks,
        meetings
      ] = await Promise.all([
        fetchEnhancedConversationHistory(query, mobileNumber, realIndex, spaceId),
        similaritySearch(query, realIndex),
        handleCampaignVariables(realIndex, spaceId),
        fetchCustomerData(realIndex, mobileNumber),
        fetchProductLinks(realIndex),
        getMeetingsByUser(space?.userId ?? 0)
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
        campaignVariables,
        meetings
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

