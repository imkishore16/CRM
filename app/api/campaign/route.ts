import { NextResponse,NextRequest } from "next/server";
import prisma from "@/lib/db";
import twilioClient from "@/clients/twilioClient";
import redis from "@/clients/redis";
import { Queue } from "bull";
import Bull from "bull";
import pc from "@/clients/pinecone";
import { fetchModelProvider } from "@/app/actions/prisma";
import { getLLM } from "@/clients/llm";
import SpacesCard from "@/components/SpacesCard";
import { generateResponse, handleCampaignVariables } from "@/lib/serverUtils";
import { CampaignVariables } from "@/types";
import { fetchCustomerData } from "@/app/actions/pc";


// store user conversation in db and make a fetch to find if user has ghosted / or use the conversationEnded variable to send followup message
//exapnd the start campaign function , create process queue ,ie the followup ,ie send a followup message by accessing redis 
// start the campaign , ie run a message queue that will send messages to everyone
export async function POST(req:NextRequest){
  try {
    const { searchParams } = new URL(req.url);

      const spaceId = searchParams.get("spaceId") ?? "" ; 
  
      const mobileNumbers = await fetchMobileNumbers(parseInt(spaceId));
      
      const indexName = "campaign" + spaceId;
      const index = pc.index(indexName, `https://${indexName}-${process.env.PINECONE_URL}`);
      const response = await index.namespace("variables").query({
        filter: {
          source: { $eq: "initialMessage" }
        },
        topK: 1,
        includeMetadata: true,
        vector: new Array(384).fill(0)
      });
      
      // let initialMessage = "Hi"
      let initialMessage : any
      if (response.matches && response.matches.length > 0 && response.matches[0].metadata) {
        initialMessage = response.matches[0].metadata.value || "";
      }
      
      const modelProvider = await fetchModelProvider(parseInt(spaceId))
      const model = getLLM(modelProvider ?? "gemini")
      const campaignVariables = await handleCampaignVariables(index,parseInt(spaceId))
      
      for (const mobileNumber of mobileNumbers) {
        const customInitialMessage = await customFirstMessage(index,model,mobileNumber,campaignVariables);
        await sendFirstMessage(mobileNumber,customInitialMessage)
      }
  
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Error running campaign:", error);
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}


export async function customFirstMessage(index:any,model:any ,mobileNumber: string,campaignVariables:CampaignVariables): Promise<string> {
  const customerData = await fetchCustomerData(index,mobileNumber)
  const llmResponse = await generateResponse(model,"",customerData,"",campaignVariables)
  return llmResponse
}

async function sendFirstMessage(mobileNumber: string, customInitialMessage : string): Promise<void> {
    try {
      await twilioClient.messages.create({
          body: customInitialMessage,
          from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
          to: `whatsapp:${"+91"}${mobileNumber}` 

        });
      console.log(`Message sent to ${'+91'}${mobileNumber}`);
    } catch (error) {
      console.error(`Failed to send message to ${mobileNumber}:`, error);
    }
}

async function fetchMobileNumbers(spaceId: number): Promise<string[]> {
    const customers = await prisma.spaceCustomer.findMany({
      where: { spaceId },
      select: { mobileNumber: true },
    });
    return customers.map((customer:any) => customer.mobileNumber);
}

// async function updateCampaignStatus(mobileNumber: string, campaignId: number): Promise<void> {
//     await prisma.spaceCustomer.updateMany({
//       where: { mobileNumber },
//       data: { status: true },
//     });
// }