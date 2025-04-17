"use server"

import prisma from "@/lib/db";

export async function updateModelProvider(spaceId: number, modelProvider: string) {
  
    const updated = await prisma.space.update({
      where: { id: spaceId },
      data: { modelProvider },
    });
  
    return updated;
}
export async function fetchModelProvider(spaceId: number) {
  
    const space = await prisma.space.findFirst({
      where: { id: spaceId },
    });
  
    return space?.modelProvider;
}


export async function addConversation(spaceId: number, mobileNumber:string,content:string , sender:"BOT" | "USER" ) {
    
  await prisma.conversation.create({
    data: {
        spaceId: spaceId,
        mobileNumber: mobileNumber,
        content:content,
        sender:sender
    },
  });
}

export async function fetchConversationHistory(spaceId: number, mobileNumber: string) {
  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        spaceId: spaceId,
        mobileNumber: mobileNumber,
      },
      orderBy: {
        createdAt: 'asc'
      },
    });
    
    return { conversations };
  } catch (error) {
    console.error("Error fetching conversation history:", error);
    return null;
  }
}

export const getUniqueMobileNumbersBySpace = async (spaceId: number) => {
  return await prisma.conversation.findMany({
    where: { spaceId },
    distinct: ["mobileNumber"], // distinct on mobileNumber
    select: { mobileNumber: true },
  });
};


export const getConversationsByMobileNumber = async (spaceId: number, mobileNumber: string) => {
  return await prisma.conversation.findMany({
    where: {
      spaceId,
      mobileNumber,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

