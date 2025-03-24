import { NextRequest, NextResponse } from "next/server";
import pc from "@/clients/pinecone";
import llm from "@/clients/llm";
import embeddingModel from "@/clients/embeddingModel";
import prisma from "@/lib/db";
import { HuggingFaceInference } from "@langchain/community/llms/hf"; // For Hugging Face LLM
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import redis from "@/clients/redis";
import twilioClient from "@/clients/twilioClient";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

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

async function parseFormEncodedBody(req: NextRequest) {
  const rawBody = await req.text(); 
  return Object.fromEntries(new URLSearchParams(rawBody)); 
}
export async function POST(req: NextRequest) {
    try {
      
        const data = await parseFormEncodedBody(req); 
        console.log("Received Twilio payload:", data);
        const mobileNumber = data.From?.replace("whatsapp:", ""); 
        const query = data.Body;

        if (!query) {
            return NextResponse.json({ error: "Query is required" }, { status: 400 });
        }
        if (!mobileNumber) {
            console.log("no mobile numbner")
            return NextResponse.json({ error: "MobileNumber is required" }, { status: 400 });
        }

        const spaceCustomer = await prisma.spaceCustomer.findFirst({
          where: { mobileNumber: mobileNumber },
          select: { spaceId: true },
      });
      
        const spaceId = spaceCustomer?.spaceId ?? 0;
        const indexName="campaign"+spaceId;
        const index = pc.index(indexName , `https://${indexName}-${process.env.PINECONE_URL}`);

        const pastConversations = await fetchConversationHistory(query,mobileNumber,index);
        console.log(2)
        
        const combinedConversations = pastConversations.join("\n");
        console.log(3)
        
        const relevantDocs = await similaritySearch(query, index);
        console.log(4)
        
        const campaignVariables = await handleCampaignVariables(index,spaceId || 0);

        const response = await generateResponse(query,relevantDocs,combinedConversations ,campaignVariables);
        console.log(5)
        
        await saveConversation(mobileNumber, query, response,index);
        
        await twilioClient.messages.create({
          body: response,
          from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`, 
          to: `whatsapp:${mobileNumber}` 
        });

        return NextResponse.json({ message: response }, { status: 200 });

    } catch (error) {
        console.error("Error processing request:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}


async function saveConversation(mobileNumber: string, query: string, response: string, index: any): Promise<void> {
  try {
    const [queryEmbedding, responseEmbedding] = await Promise.all([
      embeddingModel.embedQuery(query),
      embeddingModel.embedQuery(response)
    ]);
    
    const summary = await summarizeConversation(query, response);
    
    await index.namespace(mobileNumber).upsert([
      {
        id: `query_${Date.now()}`, 
        values: queryEmbedding,
        metadata: {
          type: 'query',
          text: query,
          response_id: `resp_${Date.now()}`, 
          summary: summary,
          // threadId: 1,    
          timestamp: new Date().toISOString(),
        },
      },
      {
        id: `resp_${Date.now()}`, 
        values: responseEmbedding,
        metadata: {
          type: 'response',
          text: response,
          query_id: `query_${Date.now()}`, 
          summary: summary,
          // threadId: 1,
          timestamp: new Date().toISOString(),
        },
      }
    ]);
  } catch (error) {
    console.error("Error saving conversation:", error);
  }
}

async function fetchConversationHistory(query:string , mobileNumber: string , index:any): Promise<string[]> {
    try {
      const queryEmbedding = await embeddingModel.embedQuery(query)
      const stats = await index.describeIndexStats();
      if (stats.namespaces && stats.namespaces[mobileNumber]) {
        console.log(`Namespace "${mobileNumber} exists".`);
      } else {
        console.log(`Namespace "${mobileNumber}" does not exist in index ".`);
        return [];
      }

      const queryResponse = await index.namespace(mobileNumber).query({
        vector:queryEmbedding,
        topK: 10, 
        includeMetadata: true,
        // filter: { threadId: "latest" } 
      });
  
      if (!queryResponse.matches || queryResponse.matches.length === 0) {
        return [];
      }
  
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

async function handleCampaignVariables(index:any,spaceId:number): Promise<CampaignVariables>{
  const cacheKey = `campaign${spaceId}`;
  
  const cachedData = await redis.get(cacheKey);
  if (cachedData) {
    return JSON.parse(cachedData);
  }

  const campaignVariables = fetchCampaignDataFromVectorDB(index,spaceId)
  
  await redis.set(cacheKey, JSON.stringify(campaignVariables), "EX", 7200);

  return campaignVariables;
}

async function fetchCampaignDataFromVectorDB(index: any, spaceId: number): Promise<CampaignVariables> {
  try {
    // Create a dummy vector for querying (adjust dimension as needed)
    const dummyVector = new Array(384).fill(0);
    
    // Object to store our results
    const campaignData: CampaignVariables = {
      campaignName: "",
      campaignType: "",
      overrideCompany: "",
      personaName: "",
      jobRole: "",
      campaignObjective: "",
      communicationStyles: "",
      initialMessage: "",
      followUpMessage: ""
    };
    
    // List of fields to fetch
    const fields = [
      "campaignName",
      "campaignType",
      "overrideCompany",
      "personaName",
      "jobRole",
      "campaignObjective",
      "communicationStyles",
      "initialMessage",
      "followUpMessage"
    ];
    
    // Fetch each field individually
    for (const field of fields) {
      const response = await index.namespace("variables").query({
        filter: {
          source: { $eq: field }
        },
        topK: 1,
        includeMetadata: true,
        vector: dummyVector
      });
      
      if (response.matches && response.matches.length > 0 && response.matches[0].metadata) {
        campaignData[field as keyof CampaignVariables] = response.matches[0].metadata.value || "";
      }
    }
    
    // Check if we found any data at all
    const hasData = Object.values(campaignData).some(value => value !== "");
    
    if (!hasData) {
      // Return default values if no data found
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
    }
    
    return campaignData;
    
  } catch (error) {
    console.error("Error fetching campaign data from vector DB:", error);
    // Return default values if there's an error
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
  }
}

async function similaritySearch(query: string, index:any) {
    try {

        // const queryEmbedding  = await embeddingModel.embedQuery(query)
        //   const [vectorResults, keywordResults] = await Promise.all([
          //     index.namespace("productdata").query({
            //         vector: queryEmbedding,
            //         topK: 3,
            //         includeValues: true,
            //     }),
            //     keywordSearch(query),  // 🔥 BM25-based retrieval
            // ]);
            // const combinedResults = [...vectorResults.matches, ...keywordResults];
            // const rankedResults = await reRankResults(query, combinedResults);
            
            // return rankedResults.map((result: any) => result.metadata?.text || "").join("\n");
            
            
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


async function reRankResults(query: string, results: any[]): Promise<any[]> {
  try {
    // Format prompt as a proper message
    const messages = [
      new HumanMessage(`
        Given the user query: "${query}", re-rank the following results in order of relevance:

        Results:
        ${results.map((res, i) => `${i + 1}. ${res.metadata?.text || "No text available"}`).join("\n")}

        Return the results in a sorted JSON array format. Respond with ONLY a valid JSON array:
        [{"rank": 1, "text": "Most relevant result"}, {"rank": 2, "text": "Next best result"}, ...]
      `)
    ];

    // Use invoke instead of generateText
    const response = await llm.invoke(messages);
    
    // Extract content from the response
    const responseText = response.content.toString();
    
    // Find and extract the JSON portion from the response
    const jsonMatch = responseText.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (!jsonMatch) {
      throw new Error("Could not extract JSON from response");
    }
    
    const rankedResults = JSON.parse(jsonMatch[0]);

    // Map back to your original format
    return rankedResults.map((item: any) => ({
      metadata: { text: item.text },
      // Preserve any other fields from original results if needed
      rank: item.rank
    }));
  } catch (error) {
    console.error("Error in re-ranking:", error);
    
    // Add some logging to debug the error
    if (error instanceof SyntaxError) {
      console.error("JSON parsing error. Response was:", error.message);
    }
    
    return results; // If re-ranking fails, return original results
  }
}





async function summarizeConversation(query: string, response: string): Promise<string> {
  try {
    // Create a chat with system message for better control
    const messages = [
      new SystemMessage(
        "You are a precise summarization assistant. Condense conversations into single, " +
        "informative sentences capturing the key question and answer. Be clear and concise."
      ),
      new HumanMessage(
        `Summarize this conversation in ONE sentence only:
        
        User: ${query}
        
        Assistant: ${response}
        `
      )
    ];
    
    // Add timeout and retry logic
    // const result = await Promise.race([
    //   llm.invoke(messages),
    //   new Promise((_, reject) => 
    //     setTimeout(() => reject(new Error("Summarization timed out")), 10000)
    //   )
    // ]);
    const result = await llm.invoke(messages);
    
    const summary = result.content.toString().trim();
    
    // Verify we got a reasonable summary
    if (summary.length < 10) {
      throw new Error("Summary too short");
    }
    
    return summary;
  } catch (error) {
    console.error("Error summarizing conversation:", error);
    
    // Fallback summarization - take first sentence of response or truncate
    const firstSentence = response.split(/[.!?]/).filter(s => s.trim().length > 0)[0];
    if (firstSentence && firstSentence.length < 100) {
      return firstSentence.trim() + "...";
    }
    return response.length > 120 ? response.substring(0, 117) + '...' : response;
  }
}




async function generateResponse(query: string, context: string, history: string,campaignVariables:CampaignVariables): Promise<string> {
  try {

    const promptTemplate = ChatPromptTemplate.fromTemplate(`
      You are a {communicationStyles} {jobRole} representing {overrideCompany}. Your name is {personaName}. You're managing a "{campaignName}" campaign with the objective to "{campaignObjective}".

      ### IMPORTANT INSTRUCTIONS:
      1. **Personalization**:
         - Use the persona, tone, and communication style specified.
         - Respond as {personaName}, a {jobRole} at {overrideCompany}.
      
      2. **Conversation Awareness**:
         - If this is the first interaction with the user, introduce yourself appropriately.
         - If this is a follow-up conversation, acknowledge previous interactions.

      3. **Campaign Objectives**:
         - Remember that this is a {campaignType} campaign.
         - Your goal is to: {campaignObjective}
      
      4. **Response Guidelines**:
         - Be conversational, helpful, and authentic.
         - Focus on providing value and addressing the user's needs.
         - Always be truthful - do not make up information not found in the context.
         - Avoid mentioning specific links or URLs unless they appear in the provided context.
         - Never share sensitive information like promo codes or phone numbers unless they appear in the context.
      
      ### Conversation History:
      {history}
      
      ### Relevant Information:
      {context}
      
      ### Current Query:
      {query}
      
      ### Response:
    `);
    
    // const prompt2 = ChatPromptTemplate.fromTemplate(`
    //   You are a professional and friendly salesperson for a company that sells {context}. 
    //   Your goal is to introduce yourself, provide accurate and relevant information about the product, and guide the user toward making a purchase or taking the next step.
    
    //   ### Instructions:
    //   1. **Introduction**:
    //      - Start by introducing yourself and the product.
    //      - Based on {history} decide if u have to introduce yourself again or not , so dont introduce yourself for every query and reply
    //      - Example: "Hi! I'm {salespersonName}, here on behalf of {organizationName}"

       
    //   2. **Stay Contextual**:
    //      - Only provide information that is relevant to the user's query or the product.
    //      - Do not make up details or provide information outside the context.
    
    //   3. **Sell the Product**:
    //      - Highlight the key features and benefits of the product.
    //      - Explain how the product solves the user's problem or meets their needs.
    
    //   4. **Handle User Queries**:
    //      - Respond to user questions in a clear and helpful manner.
    //      - Address any concerns or objections the user might have.
        
    
    //   5. **Close the Sale**:
    //      - Guide the user toward making a purchase or taking the next step.
    //      - Example: "Would you like to proceed with the purchase? I can help you with the checkout process!"
    
    //   ### Conversation History:
    //   {history}
    
    //   ### Retrieved Context:
    //   {context}
    
    //   ### Current Query:
    //   {query}
    
    //   ### Your Response:
    // `);

    // Create a chain with the prompt, LLM, and output parser
    const chain = promptTemplate.pipe(llm).pipe(new StringOutputParser());
    
    // Determine if this is a first-time conversation based on history
    const isFirstConversation = !history || history.trim() === '' || history.length==0 
    
    // Invoke the chain with all necessary variables
    const response = await chain.invoke({
      query,
      history,
      context,
      ...campaignVariables,
      // If this is the first conversation, we might want to use the initial message
      // as a reference point for the appropriate tone and style
      initialMessage: isFirstConversation ? campaignVariables.initialMessage : "",
      followUpMessage: !isFirstConversation ? campaignVariables.followUpMessage : ""
    });

    return response;
    // need invoke a lot more stuff 
    // if past conversation exists , dont introduce again , hello there again on a new conversation / reach out again , ie the user didnt reply or different campaign , or campagin rerun 
    // on non suzzessful audience 

  } catch (error) {
    console.error("Error generating response:", error);
    return "I'm sorry, I encountered an issue while processing your request. Please try again shortly.";
  }
}