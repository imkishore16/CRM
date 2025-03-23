import { NextResponse,NextRequest } from "next/server";
import prisma from "@/lib/db";
import twilioClient from "@/clients/twilioClient";
import redis from "@/clients/redis";
import { Queue } from "bull";
import Bull from "bull";
import { CampaignVariables } from "../chat/route";

// const campaignQueue = new Bull("campaign");
// const job = await campaignQueue.add({
//   redis: {
//     host: "localhost",
//     port: 6379,
//   },
// });

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