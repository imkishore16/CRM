import { NextResponse,NextRequest } from "next/server";
import prisma from "@/lib/db";
import twilioClient from "@/clients/twilioClient";
import redis from "@/clients/redis";
import { Queue } from "bull";
import Bull from "bull";
import { CampaignVariables } from "../chat/route";



// store user conversation in db and make a fetch to find if user has ghosted / or use the conversationEnded variable to send followup message
//exapnd the start campaign function , create process queue ,ie the followup ,ie send a followup message by accessing redis 
// start the campaign , ie run a message queue that will send messages to everyone
export async function POST(req:NextRequest){
  try {
    const { searchParams } = new URL(req.url);

    const spaceId = searchParams.get("spaceId") ?? "" ; 
  
      // Fetch mobile numbers for the campaign
      const mobileNumbers = await fetchMobileNumbers(parseInt(spaceId));
  
      // Send the first message to each mobile number
      for (const mobileNumber of mobileNumbers) {
        await sendFirstMessage(mobileNumber,parseInt(spaceId));
      }
  
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Error running campaign:", error);
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}


async function sendFirstMessage(mobileNumber: string,spaceId:number): Promise<void> {
  const campaignVariables = await redis.get(`campaign${spaceId}`)
  const parsedCampaignVariables: CampaignVariables | null = campaignVariables 
  ? (JSON.parse(campaignVariables) as CampaignVariables) 
  : null;
  const initialMessage = parsedCampaignVariables?.initialMessage;
    try {
      await twilioClient.messages.create({
          from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
          to: `whatsapp:${mobileNumber}`,
          body: initialMessage,
        });
      console.log(`Message sent to ${mobileNumber}`);
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