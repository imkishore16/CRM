import { NextRequest,NextResponse } from "next/server";
import prisma from "@/lib/db";
import embeddingModel from "@/clients/embeddingModel";
import pc from "@/clients/pinecone";

// return all dashboard data for a sapce
// dashboard data na ena:
    // sentiment analysis ie how many positive feedbacks and how many negative
    // popular feebacks , requests -> store em in 

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const spaceId = searchParams.get("spaceId");

    if (!spaceId) {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // fetch all conversations of all users of a space and perform snetiment analysis


    return NextResponse.json({ customers: "pineconeResults" }, { status: 200 });
}