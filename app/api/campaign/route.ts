import { NextResponse,NextRequest } from "next/server";
import prisma from "@/lib/db";
import twilioClient from "@/clients/twilioClient";

import { Queue } from "bull";
import Bull from "bull";

const campaignQueue = new Bull("campaign");
const job = await campaignQueue.add({
  redis: {
    host: "localhost",
    port: 6379,
  },
});

// start the campaign , ie run a cron job to send messages to everyone
export async function POST(req:NextRequest){
  try {
      const { campaignId, message } = await req.json();
  
      // Fetch mobile numbers for the campaign
      const mobileNumbers = await fetchMobileNumbers(campaignId);
  
      // Send the first message to each mobile number
      for (const mobileNumber of mobileNumbers) {
        await sendFirstMessage(mobileNumber, message);
      }
  
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Error running campaign:", error);
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

async function callChatAPI(mobileNumber: string, userMessage: string): Promise<string> {
    // Call your existing chat API
    const res = await fetch("http://localhost:3000/api/sampleChat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobileNumber, query: userMessage }),
    });
    const data = await res.json();
    return data.message;
  }

async function sendFirstMessage(mobileNumber: string, message: string): Promise<void> {
    try {
      await twilioClient.messages.create({
          from: "whatsapp:+14155238886", // Twilio's WhatsApp sandbox number
          to: `whatsapp:${mobileNumber}`,
          body: message,
        });
      console.log(`Message sent to ${mobileNumber}`);
    } catch (error) {
      console.error(`Failed to send message to ${mobileNumber}:`, error);
    }
  }

async function fetchMobileNumbers(campaignId: number): Promise<string[]> {
    const customers = await prisma.spaceCustomer.findMany({
      where: { campaignId },
      select: { mobileNumber: true },
    });
    return customers.map((customer:any) => customer.mobileNumber);
}

async function updateCampaignStatus(mobileNumber: string, campaignId: number): Promise<void> {
    await prisma.spaceCustomer.updateMany({
      where: { mobileNumber, campaignId },
      data: { status: true },
    });
  }