import { NextRequest,NextResponse } from "next/server";
import prisma from "@/lib/db";
import embeddingModel from "@/clients/embeddingModel";
import pc from "@/clients/pinecone";


export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const spaceId = searchParams.get("spaceId");

    if (!spaceId) {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const customers = await prisma.spaceCustomer.findMany({
        where: { spaceId: parseInt(spaceId, 10) }, 
        select: { mobileNumber: true },
    });

    const customerIndexName = "customerdata" + spaceId;
    const customerIndex = pc.index(customerIndexName, `https://${customerIndexName}${process.env.PINECONE_URL}`);

    const pineconeResults = await Promise.all( 
        customers.map(async (customer: { mobileNumber: string }) => {
          const { mobileNumber } = customer;
          const queryResult = await customerIndex.namespace("customerdata").fetch([mobileNumber]);
          const record = queryResult.records?.[mobileNumber];
          return {
            mobileNumber,
            information: record?.metadata?.data || " ",
          };
        })
    );


    // Return the enriched customer data with information from Pinecone
    return NextResponse.json({ customers: pineconeResults }, { status: 200 });
}