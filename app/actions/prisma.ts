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


export async function addConversation(spaceId: number, mobileNumber:string,llm:string,user:string ) {
    
  await prisma.conversations.create({
    data: {
        spaceId: spaceId,
        mobileNumber: mobileNumber,
        user: user, 
        llm: llm,
    },
  });
}

export async function fetchConversationHistory(spaceId: number, mobileNumber: string) {
  try {
    const conversations = await prisma.conversations.findMany({
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