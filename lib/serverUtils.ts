

import pc from "@/clients/pinecone";
import embeddingModel from "@/clients/embeddingModel";
import prisma from "@/lib/db";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import redis from "@/clients/redis";
import twilioClient from "@/clients/twilioClient";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { chatTemplate } from "@/constants/chatTemplate";
import { CampaignVariables } from "@/types";
import { addConversation } from "@/app/actions/prisma";
import { fetchIndex } from "@/app/actions/pc";





export async function saveConversationToVecDb(llm:any,mobileNumber: string, query: string, response: string, index: any): Promise<void> {
  try {
    const [queryEmbedding, responseEmbedding] = await Promise.all([
      embeddingModel.embedQuery(query),
      embeddingModel.embedQuery(response)
    ]);
    
    const summary = await summarizeConversation(llm,query, response);
    
    await index.namespace(mobileNumber).upsert([
      {
        id: `query_resp_${Date.now()}`, 
        values: queryEmbedding,
        metadata: {
          type: 'query',
          query: query,
          response: response,
          response_id: `resp_${Date.now()}`, 
          summary: summary,
          timestamp: new Date().toISOString(),
        },
      },
    ]);
  } catch (error) {
    console.error("Error saving conversation:", error);
  }
}

export async function fetchEnhancedConversationHistory(query: string, mobileNumber: string, index: any,spaceId:number): Promise<string[]> {
  try {
    console.log("trying to fetch recent conversations")
    const recentConversations = await fetchRecentConversations(mobileNumber, 3,spaceId); // Last 3 exchanges
    console.log("fetched recent converstaions")
    const allConversations = [...recentConversations];
    
    const similarConversations = await fetchSimilarConversations(query, mobileNumber, index);
    console.log("fetched similar converstaions")
    
    
    for (const conv of similarConversations) {
      if (!allConversations.some(recent => recent.timestamp === conv.timestamp)) {
        allConversations.push(conv);
      }
    }
    
    return allConversations.map(conv => 
      `User Query: ${conv.query}\nLLM Reply: ${conv.response}\nTimestamp: ${conv.timestamp}`
    );
  } catch (error) {
    console.error("Error fetching enhanced conversation history:", error);
    return [];
  }
}

export async function fetchSimilarConversations(query:string , mobileNumber: string , index:any):Promise<Array<{
  id: string;
  query: string;
  response: string;
  timestamp: string;
}>> {
    try {
      const stats = await index.describeIndexStats();
      if (stats.namespaces && stats.namespaces[mobileNumber]) {
        console.log(`Namespace "${mobileNumber} exists".`);
      } else {
        console.log(`Namespace "${mobileNumber}" does not exist in index ".`);
        return [];
      }
      
      const queryEmbedding = await embeddingModel.embedQuery(query)
      const queryResponse = await index.namespace(mobileNumber).query({
        vector:queryEmbedding,
        topK: 10, 
        includeMetadata: true,
      });
  
      if (!queryResponse.matches || queryResponse.matches.length === 0) {
        return [];
      }
      
      return queryResponse.matches
      .filter((match:any) => match.metadata)
      .map((match :any) => {
        const metadata = match.metadata;
        return {
          query: metadata.text || metadata.query || "",
          response: metadata.response || "",
          timestamp: metadata.timestamp || new Date().toISOString(),
        };
      });

    } catch (error) {
      console.error("Error fetching conversation history:", error);
      return [];
    }
}

export async function fetchRecentConversations(mobileNumber: string , limit : number,spaceId:number): Promise<Array<{
  query: string;
  response: string;
  timestamp: string;
}>> {
  try {
    console.log("access conversation table")
    const recentMessages = await prisma.conversation.findMany({
      where: {
        spaceId:spaceId,
        mobileNumber: mobileNumber
      },
      orderBy: {
        createdAt: 'desc' 
      },
      take: limit*2
    });
    console.log("fetched recent messages" , recentMessages)
    
    const conversations: {
      query: string;
      response: string;
      timestamp: string;
    }[] = [];

    let combinedQuery = "";
    let queryTimestamp: Date | null = null;


    for (let i = 0; i < recentMessages.length; i++) {
      const msg = recentMessages[i];
    
      if (msg.sender === "USER") {
        if (combinedQuery === "") {
          queryTimestamp = msg.createdAt;
        }
        combinedQuery += (combinedQuery ? " " : "") + msg.content.trim();
      } else if (msg.sender === "BOT" && combinedQuery !== "") {
        conversations.push({
          query: combinedQuery,
          response: msg.content,
          timestamp: queryTimestamp?.toISOString() || msg.createdAt.toISOString(),
        });
    
        combinedQuery = "";
        queryTimestamp = null;
      }
    }
    console.log("fetched recent messages" , conversations)

    return conversations.reverse(); 
    
  } catch (error) {
    console.error("Error fetching recent conversations:", error);
    return [];
  }
}

export async function handleCampaignVariables(index:any,spaceId:number): Promise<CampaignVariables>{
  const cacheKey = `campaign${spaceId}`;
  
  const cachedData = await redis.get(cacheKey);
  if (cachedData && cachedData !== '{}' && cachedData.trim() !== '') {
    console.log("returning cached campaign variables")
    console.log(cachedData)
    return JSON.parse(cachedData);
  }

  const campaignVariables = await fetchCampaignDataFromVectorDB(index,spaceId)
  console.log(campaignVariables)
  
  await redis.set(cacheKey, JSON.stringify(campaignVariables), "EX", 7200);

  return campaignVariables;
}


export async function addMessageToRedis(userKey: string, message: string): Promise<void> {
  const timestamp = Date.now();
  await redis.rpush(userKey, JSON.stringify({ message, timestamp }));
  await redis.expire(userKey, 3000);
}

export async function processAggregatedMessages(llm:any , mobileNumber: string, spaceId: number): Promise<string> {
  const userKey = `${spaceId}:${mobileNumber}`;
  const processingKey = `${userKey}:processing`;
  
  try {
      // Gets all messages
      const messageItems = await redis.lrange(userKey, 0, -1);
      
      if (messageItems.length === 0) {
          return "";
      }
      
      const messages = messageItems.map(item => JSON.parse(item).message);
      const combinedQuery = messages.join(" ");
      
      console.log(`Processing aggregated messages for ${mobileNumber}:`, combinedQuery);
      
      // Process the query using your existing logic
      
      const index = await fetchIndex(spaceId)
      
      const pastConversations = await fetchEnhancedConversationHistory(combinedQuery, mobileNumber, index,spaceId);
      const combinedConversations = pastConversations.join("\n");
      const relevantDocs = await similaritySearch(combinedQuery, index);
      const campaignVariables = await handleCampaignVariables(index, spaceId);
      const response = await generateResponse(llm,combinedQuery, relevantDocs, combinedConversations, campaignVariables);
      
      // Save the conversation
      await saveConversationToVecDb(llm,mobileNumber, combinedQuery, response, index);
      
      await addConversation(spaceId,mobileNumber,response,"BOT")
      
      // Send the response via Twilio
      await twilioClient.messages.create({
          body: response,
          from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`, 
          to: `whatsapp:${mobileNumber}` 
      });
      
      // Clean up Redis after processing
      await redis.del(userKey);
      await redis.del(processingKey);
      return response
  } catch (error) {
      console.error(`Error processing messages for ${mobileNumber}:`, error);
      await redis.del(processingKey);
      return "Something went wrong "
  }
}

export async function fetchCampaignDataFromVectorDB(index: any, spaceId: number): Promise<CampaignVariables> {
  try {
    const dummyVector = new Array(384).fill(0);
    
    const campaignData: CampaignVariables = {
      campaignName: "",
      campaignType: "",
      overrideCompany: "",
      personaName: "",
      jobRole: "",
      campaignObjective: "",
      communicationStyles: "",
      initialMessage: "",
      followUpMessage: "",
    };
    const productData = ""
    
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
    
    const hasData = Object.values(campaignData).some(value => value !== "");
    
    if (!hasData) {
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


export async function similaritySearch(query: string, index:any) {
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


// async function reRankResults(query: string, results: any[]): Promise<any[]> {
//   try {
//     const messages = [
//       new HumanMessage(`
//         Given the user query: "${query}", re-rank the following results in order of relevance:

//         Results:
//         ${results.map((res, i) => `${i + 1}. ${res.metadata?.text || "No text available"}`).join("\n")}

//         Return the results in a sorted JSON array format. Respond with ONLY a valid JSON array:
//         [{"rank": 1, "text": "Most relevant result"}, {"rank": 2, "text": "Next best result"}, ...]
//       `)
//     ];

//     const response = await llm.invoke(messages);
    
//     const responseText = response.content.toString();
    
//     const jsonMatch = responseText.match(/\[\s*\{[\s\S]*\}\s*\]/);
//     if (!jsonMatch) {
//       throw new Error("Could not extract JSON from response");
//     }
    
//     const rankedResults = JSON.parse(jsonMatch[0]);

//     return rankedResults.map((item: any) => ({
//       metadata: { text: item.text },
//       rank: item.rank
//     }));
//   } catch (error) {
//     console.error("Error in re-ranking:", error);
    
//     // Add some logging to debug the error
//     if (error instanceof SyntaxError) {
//       console.error("JSON parsing error. Response was:", error.message);
//     }
    
//     return results; // If re-ranking fails, return original results
//   }
// }


export async function summarizeConversation(llm:any ,query: string, response: string): Promise<string> {
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


export async function generateResponse(llm:any ,query: string, context: string, history: string,campaignVariables:CampaignVariables): Promise<string> {
  try {
    
    const promptTemplate = ChatPromptTemplate.fromTemplate(chatTemplate.default);

    const chain = promptTemplate.pipe(llm).pipe(new StringOutputParser());
    
    const isFirstConversation = !history || history.trim() === '' || history.length==0 
    
    const response = await chain.invoke({
      query,
      history, 
      context,
      ...campaignVariables,
      initialMessage: isFirstConversation ? campaignVariables.initialMessage : "",
      followUpMessage: !isFirstConversation ? campaignVariables.followUpMessage : ""
    });
    console.log("context : ", context)
    console.log("history : ", history)
    console.log("response from generateReposne function :" , response )
    return response;
    // need invoke a lot more stuff into chattemplate
    // if past conversation exists , dont introduce again , hello there again on a new conversation / reach out again , ie the user didnt reply or different campaign , or campagin rerun 
    // on non suzzessful audience 

  } catch (error) {
    console.error("Error generating response:", error);
    return "I'm sorry, I encountered an issue while processing your request. Please try again shortly.";
  }
}