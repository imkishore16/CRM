import { NextResponse,NextRequest } from "next/server";
import prisma from "@/lib/db";
import twilioClient from "@/clients/twilioClient";
import redis from "@/clients/redis";
import { Queue } from "bull";
import Bull from "bull";
import { CampaignVariables } from "../chat/route";

export async function GET(req:NextRequest){
  try {
    // const { searchParams } = new URL(req.url);

    const spaceId = "9";
  
      // Fetch mobile numbers for the campaign
      const mobileNumbers = ["9445422734","9626044841"]
  
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
    try {
        const response = await twilioClient.messages.create({
            body: "Vanakam da mapla , madurai la irundhu",
            from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`, 
            to: `whatsapp:${"+91"}${mobileNumber}` 
        });
      console.log(`Message sent to ${mobileNumber}`);

    } catch (error) {
      console.error(`Failed to send message to ${mobileNumber}:`, error);
    }
//   const campaignVariables = await redis.get(`campaign${spaceId}`)
//   const parsedCampaignVariables: CampaignVariables | null = campaignVariables 
//   ? (JSON.parse(campaignVariables) as CampaignVariables) 
//   : null;
//   const initialMessage = parsedCampaignVariables?.initialMessage;
//     try {
//       await twilioClient.messages.create({
//           from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
//           to: `whatsapp:${mobileNumber}`,
//           body: initialMessage,
//         });
//       console.log(`Message sent to ${mobileNumber}`);
//     } catch (error) {
//       console.error(`Failed to send message to ${mobileNumber}:`, error);
//     }
  }

async function fetchMobileNumbers(spaceId: number): Promise<string[]> {
    const customers = await prisma.spaceCustomer.findMany({
      where: { spaceId },
      select: { mobileNumber: true },
    });
    return customers.map((customer:any) => customer.mobileNumber);
}

