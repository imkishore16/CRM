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
        const data = await req.json();
        const query = data.query as string;
        const mobileNumber = data.From as string;  // Twilio sends sender's number as "From"

        if (!query) {
            return NextResponse.json({ error: "Query is required" }, { status: 400 });
        }
        if (!mobileNumber) {
            console.log("no mobile numbner")
            return NextResponse.json({ error: "MobileNumber is required" }, { status: 400 });
        }

        const spaceId = await prisma.spaceCustomer.findFirst({
            where: { mobileNumber: mobileNumber },
            select: { spaceId: true },
        });
        
        const productIndexName="productdata"+spaceId;
        const productIndex = pc.index(productIndexName , `https://${productIndexName}-bh2nb1e.svc.aped-4627-b74a.pinecone.io`);
        const customerIndexName="customerdata"+spaceId;
        const customerIndex = pc.index(customerIndexName , `https://${customerIndexName}-bh2nb1e.svc.aped-4627-b74a.pinecone.io`);


        const pastConversations = await fetchConversationHistory(mobileNumber,customerIndex);

        const summarizedHistory = await summarizeConversation(pastConversations);

        const relevantDocs = await similaritySearch(query, productIndex);
        
        const response = await generateResponse(query, relevantDocs,summarizedHistory );
        
        await saveConversation(mobileNumber, query, response,customerIndex);
        return NextResponse.json({ message: response }, { status: 200 });
    } catch (error) {
        console.error("Error processing request:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}


async function saveConversation(mobileNumber: string, query: string, response: string, index : any): Promise<void> {
    try {
      
  
      // Generate embeddings for the conversation
      const embedding = await embeddingModel.embedQuery(query);
  
      // Save the conversation with metadata
      await index.namespace(mobileNumber).upsert([
        {
          id: `conv_${Date.now()}`, // Unique ID for the conversation
          values: embedding,
          metadata: {
            user_query: query,
            llm_reply: response,
            timestamp: new Date().toISOString(),
          },
        },
      ]);
    } catch (error) {
      console.error("Error saving conversation:", error);
    }
}

async function fetchConversationHistory(mobileNumber: string , index:any): Promise<string[]> {
    try {
  
      // Fetch all conversations for the user (namespace = mobileNumber)
      const queryResponse = await index.namespace(mobileNumber).query({
        topK: 100, // Fetch all conversations (adjust as needed)
        includeMetadata: true,
      });
  
      if (!queryResponse.matches || queryResponse.matches.length === 0) {
        return [];
      }
  
      // Combine the text from the conversations
      const conversations = queryResponse.matches.map((match:any) => {
        const metadata = match.metadata;
        return `User Query: ${metadata.user_query}\nLLM Reply: ${metadata.llm_reply}`;
      });
  
      return conversations;
    } catch (error) {
      console.error("Error fetching conversation history:", error);
      return [];
    }
}


async function similaritySearch(query: string, index:any) {
    try {

        const queryEmbedding  = await embeddingModel.embedQuery(query)

        const queryResponse = await index.namespace("productdata").query({
            vector: queryEmbedding ,
            topK: 3,
            includeValues: true,
        });

        if (!queryResponse.matches || queryResponse.matches.length === 0) {
            return "No relevant results found.";
        }
        const relevantTexts = queryResponse.matches
            .map((match:any) => match.metadata?.text || "")
            .join("\n");

        return relevantTexts;

    } catch (error) {
        console.error("Error in similarity search:", error);
        return "Error searching database.";
    }
}


async function generateResponse(query: string, context: string, history: string): Promise<string> {
    try {
      // Combine conversation history and context
      const fullContext = `
        Conversation History:
        ${history}
        
        Retrieved Context:
        ${context}
        
        Current Query:
        ${query}
      `;
  
      // Create a prompt template for RAG
      const prompt = ChatPromptTemplate.fromTemplate(`
        You are a helpful assistant. Use the following context and conversation history to answer the user's question:
        
        {fullContext}
        
        Question:
        {query}
      `);
  
      // Create a chain with the prompt, LLM, and output parser
      const chain = prompt.pipe(llm).pipe(new StringOutputParser());
  
      // Generate the response
      const response = await chain.invoke({ fullContext, query });
  
      return response;
    } catch (error) {
      console.error("Error generating response:", error);
      return "Failed to generate a response.";
    }
  }

async function summarizeConversation(history: string[]): Promise<string> {
    const summarizationModel = new HuggingFaceInference({
        apiKey: process.env.HUGGINGFACE_API_KEY,
        model: "facebook/bart-large-cnn",
    });

    const summary = await summarizationModel.call(history.join("\n"));
    return summary;
}