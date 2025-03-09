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



export async function POST(req: NextRequest) {
    try {
        const data = await req.json();
        const query = data.query as string;

        if (!query) {
            return NextResponse.json({ error: "Query is required" }, { status: 400 });
        }

        const spaceId = 8
        const mobileNumber= "9445422734"
        const productIndexName="productdata"+spaceId;
        const productIndex = pc.index(productIndexName);
        const customerIndexName="customerdata"+spaceId;
        const customerIndex = pc.index(customerIndexName);

        console.log(1)
        const pastConversations = await fetchConversationHistory(query,mobileNumber,customerIndex);
        console.log(2)
        
        // const summarizedHistory = await summarizeConversation(pastConversations);
        const combinedConversations = pastConversations.join("\n");
        console.log(3)
        
        const relevantDocs = await similaritySearch(query, productIndex);
        console.log(4)
        
        const response = await generateResponse(query, relevantDocs,combinedConversations );
        console.log(5)
        
        await saveConversation(mobileNumber, query, response,customerIndex);
        console.log(6)

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

async function fetchConversationHistory(query:string , mobileNumber: string , index:any): Promise<string[]> {
    try {
      const queryEmbedding = await embeddingModel.embedQuery(query)
      const stats = await index.describeIndexStats();
      // Check if the namespace exists
      if (stats.namespaces && stats.namespaces[mobileNumber]) {
        console.log(`Namespace "${mobileNumber} exists".`);
      } else {
        console.log(`Namespace "${mobileNumber}" does not exist in index ".`);
        return [];
      }

      const queryResponse = await index.namespace(mobileNumber).query({
        vector:queryEmbedding,
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
      console.log("conversations : " , conversations);
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

        product name

        links
        promo codes
        mobile numbers

      `;
  
      // Create a prompt template for RAG

      const prompt1 = ChatPromptTemplate.fromTemplate(`
        You are a professional and friendly salesperson for a company that sells {product}. Your goal is to introduce yourself, provide accurate and relevant information about the product, and guide the user toward making a purchase or taking the next step.
      
        ### Instructions:
        1. **Introduction**:
           - Start by introducing yourself and the product.
           - Example: "Hi! I'm {salespersonName}, your personal sales assistant for {product}. How can I help you today?"
      
        2. **Stay Contextual**:
           - Only provide information that is relevant to the user's query or the product.
           - Do not make up details or provide information outside the context.
      
        3. **Sell the Product**:
           - Highlight the key features and benefits of the product.
           - Explain how the product solves the user's problem or meets their needs.
           - Example: "Our {product} is designed to {key benefit}. It also includes features like {feature1}, {feature2}, and {feature3}."
      
        4. **Handle User Queries**:
           - Respond to user questions in a clear and helpful manner.
           - Address any concerns or objections the user might have.
           - Example: "I understand your concern about {concern}. Let me assure you that our product {addresses concern}."
      
        5. **Close the Sale**:
           - Guide the user toward making a purchase or taking the next step.
           - Example: "Would you like to proceed with the purchase? I can help you with the checkout process!"
      
        ### Conversation History:
        {history}
      
        ### Retrieved Context:
        {context}
      
        ### Current Query:
        {query}
      
        ### Your Response:
      `);
      
      const prompt2 = ChatPromptTemplate.fromTemplate(`
        You are a professional and friendly salesperson for a company that sells {context}. 
        Your goal is to introduce yourself, provide accurate and relevant information about the product, and guide the user toward making a purchase or taking the next step.
      
        ### Instructions:
        1. **Introduction**:
           - Start by introducing yourself and the product.
           - Based on {history} decide if u have to introduce yourself again or not , so dont introduce yourself for every query and reply
           - Example: "Hi! I'm {salespersonName}, here on behalf of {organizationName}"

         
        2. **Stay Contextual**:
           - Only provide information that is relevant to the user's query or the product.
           - Do not make up details or provide information outside the context.
      
        3. **Sell the Product**:
           - Highlight the key features and benefits of the product.
           - Explain how the product solves the user's problem or meets their needs.
      
        4. **Handle User Queries**:
           - Respond to user questions in a clear and helpful manner.
           - Address any concerns or objections the user might have.
          
      
        5. **Close the Sale**:
           - Guide the user toward making a purchase or taking the next step.
           - Example: "Would you like to proceed with the purchase? I can help you with the checkout process!"
      
        ### Conversation History:
        {history}
      
        ### Retrieved Context:
        {context}
      
        ### Current Query:
        {query}
      
        ### Your Response:
      `);
  
      // Create a chain with the prompt, LLM, and output parser
      const chain = prompt2.pipe(llm).pipe(new StringOutputParser());
        
      const salespersonName="vadakunatan"
      const organizationName="facebook"
      // Generate the response
      const response = await chain.invoke({salespersonName,organizationName, query ,history,context}); 
      // need invoke a lot more stuff 
      // if past conversation exists , dont introduce again , hello there again on a new conversation / reach out again , ie the user didnt reply or different campaign , or campagin rerun 
      // on non suzzessful audience 
  
      return response;
    } catch (error) {
      console.error("Error generating response:", error);
      return "Failed to generate a response.";
    }
}

  // async function summarizeConversation(history: string[]): Promise<string> {
  //   const summarizationModel = new HuggingFaceInference({
  //     apiKey: process.env.HUGGINGFACE_API_KEY,
  //     model: "sshleifer/distilbart-cnn-12-6", // Smaller and faster model
  //   });
  
  //   try {
  //     const summary = await summarizationModel.call({
  //       inputs: history.join("\n"), // Combine history into a single string
  //       parameters: { return_full_text: false }, // Optional parameters
  //     });
  //     return summary;
  //   } catch (error) {
  //     console.error("Error summarizing conversation:", error);
  //     return "Failed to generate a summary.";
  //   }
  // }