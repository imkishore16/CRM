import { NextRequest, NextResponse } from "next/server";
import pc from "@/clients/pinecone";
import embeddingModel from "@/clients/embeddingModel";
import prisma from "@/lib/db";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import redis from "@/clients/redis";
import twilioClient from "@/clients/twilioClient";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { chatTemplate } from "@/constants/chatTemplate";
import { getLLM } from "@/clients/llm";
import { CampaignVariables } from "@/types";
import { spawn } from "child_process";
import { addMessageToRedis, processAggregatedMessages } from "@/lib/serverUtils";
import { addConversation } from "@/app/actions/prisma";
const DEBOUNCE_SECONDS = 2;
const REDIS_MESSAGE_PREFIX = 'whatsapp:pending:';

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

        //TODO : move this to redis
        const spaceCustomer = await prisma.spaceCustomer.findFirst({
          where: { mobileNumber: mobileNumber },
          select: { spaceId: true },
        });

      const spaceId = spaceCustomer?.spaceId ?? 0;

      await addConversation(spaceId,mobileNumber,query,"USER")
      
      // Create a unique key for this user based on spaceId and mobileNumber
      const userKey = `${REDIS_MESSAGE_PREFIX}${spaceId}:${mobileNumber}`;
      const processingKey = `${userKey}:processing`;

      await addMessageToRedis(userKey, query);
      const isProcessing = await redis.get(processingKey);
      if (isProcessing==null) {
        await redis.set(processingKey, "true", "EX", DEBOUNCE_SECONDS);
        // Schedule processing after debounce period
        setTimeout(async () => {
          const space = await prisma.space.findFirst({
            where: { id: spaceId },
            select: { modelProvider: true },
          });
          const llmKey = `${spaceId}:llm`;
          let llmProvider: string | null = await redis.get(llmKey);
          if (!llmProvider) {
            llmProvider = space?.modelProvider ?? "gemini";
            await redis.set(llmKey, llmProvider);
          }

          const llm = getLLM(llmProvider);
          await processAggregatedMessages(llm,mobileNumber, spaceId);
        }, DEBOUNCE_SECONDS * 1000);
    }

        return NextResponse.json({ message: "response" }, { status: 200 });

    } catch (error) {
        console.error("Error processing request:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

