import { NextRequest,NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const formData = await req.formData();
    const query = formData.get('query') as string;

    //similarity search the db , get response and send it to LLM to construct proper return data
    return NextResponse.json(
        { message: query },
        { status: 200 }
    );
}