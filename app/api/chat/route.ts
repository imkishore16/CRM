import { NextRequest, NextResponse } from "next/server";
import pc from "@/client/pinecone";
import { OpenAI } from "@langchain/openai";
import llm from "@/client/llm";
import embeddingModel from "@/client/embeddingModel";
import prisma from "@/lib/db";
import { HuggingFaceInference } from "@langchain/community/llms/hf"; // For Hugging Face LLM
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf"; // For Hugging Face embeddings
import { RetrievalQAChain } from "langchain/chains";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";


// this is the chat api , the bread and butter for the conversation to take place 
/*
For a conversation to take place , the user will need to recienve the respone from thr LLm which is the respone vvarialbe
the llm needs to know the user , so that it can fetch the index and past conversation */
export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const query = formData.get("query") as string;
        const mobileNumber = formData.get("From") as string;  // Twilio sends sender's number as "From"
        if (!query) {
            return NextResponse.json({ error: "Query is required" }, { status: 400 });
        }

        const spaceId = await prisma.spaceCustomer.findUnique({
            where: { mobileNumber: mobileNumber },
            select: { spaceId: true },
        });
        const indexName="productdata"+spaceId;
        const relevantDocs = await similaritySearch(query, indexName);
        
        const response = await generateResponse(query, relevantDocs);

        return NextResponse.json({ message: response }, { status: 200 });
    } catch (error) {
        console.error("Error processing request:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

async function chain(query: string) {
    try {
        const prompt = ChatPromptTemplate.fromTemplate("Tell me a joke about {query}");
        const parser = new StringOutputParser();
        const chain = prompt.pipe(llm).pipe(parser);

        const stream = await chain.stream({ query });

        let result = "";
        for await (const chunk of stream) {
            result += chunk;
        }

        return result;
    } catch (error) {
        console.error("Error generating response:", error);
        return "Failed to generate a response.";
    }
}

async function similaritySearch(query: string, indexName: string) {
    try {
        const index = pc.index(indexName);

        const queryEmbedding  = await embeddingModel.embedQuery(query)

        const queryResponse = await index.namespace(indexName).query({
            vector: queryEmbedding ,
            topK: 3,
            includeValues: true,
        });

        if (!queryResponse.matches || queryResponse.matches.length === 0) {
            return "No relevant results found.";
        }
        const relevantTexts = queryResponse.matches
            .map((match) => match.metadata?.text || "")
            .join("\n");

        return relevantTexts;

    } catch (error) {
        console.error("Error in similarity search:", error);
        return "Error searching database.";
    }
}


async function generateResponse(query: string, context: string): Promise<string> {
    try {
      // Create a prompt template for RAG
      const prompt = ChatPromptTemplate.fromTemplate(`
        You are a helpful assistant. Use the following context to answer the user's question:
        
        Context:
        ${context}
        
        Question:
        {query}
      `);
  
      // Create a chain with the prompt, LLM, and output parser
      const chain = prompt.pipe(llm).pipe(new StringOutputParser());
  
      // Generate the response
      const response = await chain.invoke({ query });
  
      return response;
    } catch (error) {
      console.error("Error generating response:", error);
      return "Failed to generate a response.";
    }
}

async function summarizeConversation(history: string[]): Promise<string> {
    const summarizationModel = new HuggingFaceInference({
        // apiKey: HF_API_KEY,
        model: "facebook/bart-large-cnn",
    });

    const summary = await summarizationModel.call(history.join("\n"));
    return summary;
}