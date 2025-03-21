import { NextRequest, NextResponse } from "next/server";
import pc from "@/clients/pinecone";
import { OpenAI } from "@langchain/openai";
import llm from "@/clients/llm";
import embeddingModel from "@/clients/embeddingModel";
import prisma from "@/lib/db";
import { HuggingFaceInference } from "@langchain/community/llms/hf"; // For Hugging Face LLM
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf"; // For Hugging Face embeddings
import { RetrievalQAChain } from "langchain/chains";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { reservationsUrl } from "twilio/lib/jwt/taskrouter/util";
import redis from "@/clients/redis";

export interface CampaignVariables {
  campaignName: string;
  campaignType: string;
  overrideCompany: string;
  personaName: string;
  jobRole: string;
  campaignObjective: string;
  communicationStyles: string;
  initialMessage: string;
  followUpMessage: string;
}

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
        
        const indexName="campaign"+spaceId;
        const index = pc.index(indexName , `https://${indexName}-${process.env.PINECONE_URL}`);

        //conversation data
        const pastConversations = await fetchConversationHistory(mobileNumber,index);
        const summarizedHistory = await summarizeConversation(pastConversations);

        //similarity search for product data
        const relevantDocs = await similaritySearch(query,"productdata",index);
        
        // store / get cached variables
        const campaignVariables = await handleCampaignVariables(index,spaceId?.spaceId || 0);

        // pass everything to the template
        const response = await generateResponse(query, relevantDocs, summarizedHistory , campaignVariables);
        
        await saveConversation(mobileNumber, query, response,index);
        return NextResponse.json({ message: response }, { status: 200 });

    } catch (error) {
        console.error("Error processing request:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}



async function handleCampaignVariables(index:any,spaceId:number): Promise<CampaignVariables>{
    const cacheKey = `campaign${spaceId}`;
    
    //If already present , just return
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }

    // else get from vec db first
    const campaignVariables = fetchCampaignDataFromVectorDB(index,spaceId)
    
    //now store in redis then return
    await redis.set(cacheKey, JSON.stringify(campaignVariables), "EX", 7200);

    return campaignVariables;
}


async function fetchCampaignDataFromVectorDB(index:any , spaceId: number): Promise<CampaignVariables> {
  try {
    
    const queryResponse = await index.namespace("variables").query({
      filter: {source: "variables",},
      topK: 1,
      includeMetadata: true,
      // Since values array is empty, we need an alternative approach:
      // 1. Either provide a dummy vector of the right dimension
      // 2. Or use Pinecone's metadata-only query if available
      vector: new Array(1536).fill(0), // Dummy vector (adjust dimension as needed)
    });
    
    // Check if we got any matches
    if (queryResponse.matches && queryResponse.matches.length > 0 && queryResponse.matches[0].metadata) {
        const metadata = queryResponse.matches[0].metadata;
      
        // Convert the metadata to our CampaignVariables format
        return {
          campaignName: metadata.campaignName || "",
          campaignType: metadata.campaignType || "",
          overrideCompany: metadata.overrideCompany || "",
          personaName: metadata.personaName || "",
          jobRole: metadata.jobRole || "",
          campaignObjective: metadata.campaignObjective || "",
          communicationStyles: metadata.communicationStyles || "",
          initialMessage: metadata.initialMessage || "",
          followUpMessage: metadata.followUpMessage || ""
        };
    }
    
    return {
      campaignName: "Default Campaign",
      campaignType: "Standard",
      overrideCompany: "",
      personaName: "AI Assistant",
      jobRole: "Customer Support",
      campaignObjective: "Assist customers",
      communicationStyles: "Friendly, Professional",
      initialMessage: "Hello! How can I help you today?",
      followUpMessage: "Is there anything else you'd like assistance with?"
    };

  } catch (error) {
    console.error("Error fetching campaign data from vector DB:", error);
    // Return default values if there's an error
    return {
      campaignName:  "Default Campaign",
      campaignType: "Standard",
      overrideCompany: "",
      personaName: "AI Assistant",
      jobRole: "Customer Support",
      campaignObjective: "Assist customers",
      communicationStyles: "Friendly, Professional",
      initialMessage: "Hello! How can I help you today?",
      followUpMessage: "Is there anything else you'd like assistance with?"
    };
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

async function similaritySearch(query: string, namespace:string ,index:any) {
    try {

        const queryEmbedding  = await embeddingModel.embedQuery(query)

        const queryResponse = await index.namespace(namespace).query({
            vector: queryEmbedding ,
            topK: 3,
            includeValues: true,
            includeMetadata: true
        });

        if (!queryResponse.matches || queryResponse.matches.length === 0) {
            return "No relevant results found.";
        }
        console.log(queryResponse)
        
        
        // Extract the text from the metadata of each match , ie uses metadata
        const relevantTexts = queryResponse.matches
          .map((match: any) => match.metadata?.text || "")
          .filter((text: string) => text.trim() !== "")
          .join("\n\n");
        
        
        //what is  queryResponse.pageContent

        return relevantTexts

    } catch (error) {
        console.error("Error in similarity search:", error);
        return "Error searching database.";
    }
}


async function generateResponse(query: string, context: string, history: string , campaignVariables:CampaignVariables): Promise<string> {
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
  
      const prompt = ChatPromptTemplate.fromTemplate(`
        You are a helpful assistant. Use the following context and conversation history to answer the user's question:
        
        {fullContext}
        
        Question:
        {query}
      `);
  
      // Create a chain with the prompt, LLM, and output parser
      const chain = prompt.pipe(llm).pipe(new StringOutputParser());
  
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