import { NextRequest, NextResponse } from "next/server";
import pc from "@/clients/pinecone";
import embeddingModel from "@/clients/embeddingModel";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import redis from "@/clients/redis";
import twilio from 'twilio';
import twilioClient from "@/clients/twilioClient";
import prisma from "@/lib/db";
import { addMessageToRedis,saveConversationToVecDb,generateResponse,handleCampaignVariables,similaritySearch,fetchEnhancedConversationHistory} from "../chat/route";
import { CampaignVariables } from "@/types";
import { getLLM } from "@/clients/llm";

const DEBOUNCE_SECONDS = 2;
const REDIS_MESSAGE_PREFIX = 'whatsapp:pending:';



export async function POST(req: NextRequest ) {
    try {
        const { searchParams } = new URL(req.url);

        const spaceId = parseInt(searchParams.get("spaceId") ?? "0")
        const data= await req.json();
        const query = data.query as string;
        const mobileNumber=data.mobileNumber || "1234567890"
        if (!query) {
          return NextResponse.json({ error: "Query is required" }, { status: 400 });
      }
      if (!mobileNumber) {
          console.log("no mobile numbner")
          return NextResponse.json({ error: "MobileNumber is required" }, { status: 400 });
      }
      console.log(1)
      await prisma.conversation.create({
        data: {
            spaceId: spaceId,
            mobileNumber: mobileNumber,
            sender:"USER",
            content:query
        },
      });

      const userKey = `${REDIS_MESSAGE_PREFIX}${spaceId}:${mobileNumber}`;
      const processingKey = `${userKey}:processing`;
      console.log(2)

      await addMessageToRedis(userKey, query);
      console.log(3)

      const isProcessing = await redis.get(processingKey);
      if (isProcessing) {
      console.log(4)
          return NextResponse.json({message:"null"}, { status: 200 });
      }
      console.log(5)

      const debouncePromise = new Promise(resolve => {
        setTimeout(resolve, DEBOUNCE_SECONDS * 1000);
    }); 
    await debouncePromise;
    const space = await prisma.space.findFirst({
        where: { id: spaceId },
        select: { modelProvider: true },
    });
    console.log(space?.modelProvider)
    const llmKey = `${spaceId}:llm`;
    let llmProvider: string | null = await redis.get(llmKey);
    if (!llmProvider) {
        llmProvider = space?.modelProvider ?? "gemini";
        await redis.set(llmKey, llmProvider);
    }
    console.log(6)

    const llm = getLLM(llmProvider);
    console.log(7)
    
    // Process and get the actual response
    const response = await processAggregatedMessages(llm, mobileNumber, spaceId,userKey);
    console.log(response)
    return NextResponse.json({ message: response }, { status: 200 });
    } catch (error) {
        console.error("Error processing request:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}


async function processAggregatedMessages(llm:any , mobileNumber: string, spaceId: number , userKey:string): Promise<string> {
  const processingKey = `${userKey}:processing`;
  
  try {
      const messageItems = await redis.lrange(userKey, 0, -1);
      
      if (messageItems.length === 0) {
          return "";
      }
      
      const messages = messageItems.map(item => JSON.parse(item).message);
      const combinedQuery = messages.join(" ");
      
      console.log(`Processing aggregated messages for ${mobileNumber}:`, combinedQuery);
      
      const indexName = "campaign" + spaceId;
      const index = pc.index(indexName, `https://${indexName}-${process.env.PINECONE_URL}`);
      
      const pastConversations = await fetchEnhancedConversationHistory(combinedQuery, mobileNumber, index,spaceId);
      const combinedConversations = pastConversations.join("\n");
      const relevantDocs = await similaritySearch(combinedQuery, index);
      const campaignVariables = await handleCampaignVariables(index, spaceId);
      const response = await generateResponse(llm,combinedQuery, relevantDocs, combinedConversations, campaignVariables);
      
      await saveConversationToVecDb(llm,mobileNumber, combinedQuery, response, index);
      
      await prisma.conversation.create({
        data: {
            spaceId: spaceId,
            mobileNumber: mobileNumber,
            sender:"BOT",
            content:response
        },
    });
      await redis.del(userKey);
      await redis.del(processingKey);
      return response
  } catch (error) {
      console.error(`Error processing messages for ${mobileNumber}:`, error);
      await redis.del(processingKey);
      return "Something went wrong "
  }
}






















































































































































// async function fetchEnhancedConversationHistory(query: string, mobileNumber: string, index: any): Promise<string[]> {
//   try {
//     // Get most recent conversations (for continuity)
//     const recentConversations = await fetchRecentConversations(mobileNumber, 3); // Last 3 exchanges
//     // Merge and deduplicate (recent conversations take precedence)
//     const allConversations = [...recentConversations];
    
//     // Get semantically similar conversations
//     const similarConversations = await fetchSimilarConversations(query, mobileNumber, index);
    
    
//     // Add similar conversations that aren't already included in recent ones
//     for (const conv of similarConversations) {
//       if (!allConversations.some(recent => recent.timestamp === conv.timestamp)) {
//         allConversations.push(conv);
//       }
//     }
//     // Format for context window
//     return allConversations.map(conv => 
//       `User Query: ${conv.query}\nLLM Reply: ${conv.response}\nTimestamp: ${conv.timestamp}`
//     );
//   } catch (error) {
//     console.error("Error fetching enhanced conversation history:", error);
//     return [];
//   }
// }

// async function fetchSimilarConversations(query:string , mobileNumber: string , index:any):Promise<Array<{
//   id: string;
//   query: string;
//   response: string;
//   timestamp: string;
// }>> {
//     try {
//       const stats = await index.describeIndexStats();
//       if (stats.namespaces && stats.namespaces[mobileNumber]) {
//         console.log(`Namespace "${mobileNumber} exists".`);
//       } else {
//         console.log(`Namespace "${mobileNumber}" does not exist in index ".`);
//         return [];
//       }
      
//       const queryEmbedding = await embeddingModel.embedQuery(query)
//       const queryResponse = await index.namespace(mobileNumber).query({
//         vector:queryEmbedding,
//         topK: 10, 
//         includeMetadata: true,
//       });
  
//       if (!queryResponse.matches || queryResponse.matches.length === 0) {
//         return [];
//       }
      
//       return queryResponse.matches
//       .filter((match:any) => match.metadata)
//       .map((match :any) => {
//         const metadata = match.metadata;
//         return {
//           query: metadata.text || metadata.query || "",
//           response: metadata.response || "",
//           timestamp: metadata.timestamp || new Date().toISOString(),
//         };
//       });

//     } catch (error) {
//       console.error("Error fetching conversation history:", error);
//       return [];
//     }
// }

// async function fetchRecentConversations(mobileNumber: string , limit : number): Promise<Array<{
//   query: string;
//   response: string;
//   timestamp: string;
// }>> {
//   try {
//     // Query the database for the most recent conversations
//     const recentConversations = await prisma.conversation.findMany({
//       where: {
//         mobileNumber: mobileNumber
//       },
//       orderBy: {
//         createdAt: 'desc' 
//       },
//       take: limit
//     });
    
//     // Format the data for consistency with vector retrieval
//     return recentConversations.map(conv => ({
//       query: conv.user,
//       response: conv.llm,
//       timestamp: conv.createdAt.toISOString(),
//     })).reverse(); // Reverse to get chronological order (oldest first)
    
//   } catch (error) {
//     console.error("Error fetching recent conversations:", error);
//     return [];
//   }
// }


// async function handleCampaignVariables(index:any,spaceId:number): Promise<CampaignVariables>{
//   const cacheKey = `campaign${spaceId}`;
  
//   const cachedData = await redis.get(cacheKey);
//   if (cachedData) {
//     console.log("cachedData :" , cachedData)
//     return JSON.parse(cachedData);
//   }

//   const campaignVariables =await fetchCampaignDataFromVectorDB(index,spaceId)

//   console.log("campaignVariables ;" , campaignVariables)
  
//   await redis.set(cacheKey, JSON.stringify(campaignVariables), "EX", 7200);

//   return campaignVariables;
// }

// async function addMessageToRedis(userKey: string, message: string): Promise<void> {
//   const timestamp = Date.now();
//   // Store as a list of timestamped messages
//   await redis.rpush(userKey, JSON.stringify({ message, timestamp }));
//   // Set expiration on the key to auto-cleanup (15 seconds should be plenty)
//   await redis.expire(userKey, 15);
// }

// async function processAggregatedMessages(mobileNumber: string, spaceId: number): Promise<string> {
//   const userKey = `${spaceId}:${mobileNumber}`;
//   const processingKey = `${userKey}:processing`;
  
//   try {
//       // Get all messages
//       const messageItems = await redis.lrange(userKey, 0, -1);
      
//       if (messageItems.length === 0) {
//           return " ";
//       }
      
//       const messages = messageItems.map(item => JSON.parse(item).message);
//       const combinedQuery = messages.join(" ");
      
//       console.log(`Processing aggregated messages for ${mobileNumber}:`, combinedQuery);
      
//       // Process the query using your existing logic
//       const indexName = "campaign" + spaceId;
//       const index = pc.index(indexName, `https://${indexName}-${process.env.PINECONE_URL}`);
      
//       const pastConversations = await fetchEnhancedConversationHistory(combinedQuery, mobileNumber, index);
//       const combinedConversations = pastConversations.join("\n");
//       const relevantDocs = await similaritySearch(combinedQuery, index);
//       const campaignVariables = await handleCampaignVariables(index, spaceId);
//       const response = await generateResponse(combinedQuery, relevantDocs, combinedConversations, campaignVariables);
      
//       // Save the conversation
//       await saveConversationToVecDb(mobileNumber, combinedQuery, response, index);
      
//       await prisma.conversations.create({
//           data: {
//               spaceId: spaceId,
//               mobileNumber: mobileNumber,
//               user: combinedQuery, 
//               llm: response,
//           },
//       });
      
      
      
//       // Clean up Redis after processing
//       await redis.del(userKey);
//       await redis.del(processingKey);
//       return response
      
//   } catch (error) {
//       console.error(`Error processing messages for ${mobileNumber}:`, error);
//       // Clean up to prevent stuck messages
//       await redis.del(processingKey);
//       return ""
//   }
// }


// async function fetchCampaignDataFromVectorDB(index: any, spaceId: number): Promise<CampaignVariables> {
//   try {
//     // Create a dummy vector for querying (adjust dimension as needed)
//     const dummyVector = new Array(384).fill(0);
    
//     // Object to store our results
//     const campaignData: CampaignVariables = {
//       campaignName: "",
//       campaignType: "",
//       overrideCompany: "",
//       personaName: "",
//       jobRole: "",
//       campaignObjective: "",
//       communicationStyles: "",
//       initialMessage: "",
//       followUpMessage: ""
//     };
    
//     // List of fields to fetch
//     const fields = [
//       "campaignName",
//       "campaignType",
//       "overrideCompany",
//       "personaName",
//       "jobRole",
//       "campaignObjective",
//       "communicationStyles",
//       "initialMessage",
//       "followUpMessage"
//     ];
    
//     // Fetch each field individually
//     for (const field of fields) {
//       const response = await index.namespace("variables").query({
//         filter: {
//           source: { $eq: field }
//         },
//         topK: 1,
//         includeMetadata: true,
//         vector: dummyVector
//       });
      
//       if (response.matches && response.matches.length > 0 && response.matches[0].metadata) {
//         campaignData[field as keyof CampaignVariables] = response.matches[0].metadata.value || "";
//       }
//     }
    
//     // Check if we found any data at all
//     const hasData = Object.values(campaignData).some(value => value !== "");
    
//     if (!hasData) {
//       // Return default values if no data found
//       return {
//         campaignName: "Default Campaign",
//         campaignType: "Standard",
//         overrideCompany: "",
//         personaName: "AI Assistant",
//         jobRole: "Customer Support",
//         campaignObjective: "Assist customers",
//         communicationStyles: "Friendly, Professional",
//         initialMessage: "Hello! How can I help you today?",
//         followUpMessage: "Is there anything else you'd like assistance with?"
//       };
//     }
    
//     return campaignData;
    
//   } catch (error) {
//     console.error("Error fetching campaign data from vector DB:", error);
//     // Return default values if there's an error
//     return {
//       campaignName: "Default Campaign",
//       campaignType: "Standard",
//       overrideCompany: "",
//       personaName: "AI Assistant",
//       jobRole: "Customer Support",
//       campaignObjective: "Assist customers",
//       communicationStyles: "Friendly, Professional",
//       initialMessage: "Hello! How can I help you today?",
//       followUpMessage: "Is there anything else you'd like assistance with?"
//     };
//   }
// }

// async function similaritySearch(query: string, index:any) {
//     try {

//         // const queryEmbedding  = await embeddingModel.embedQuery(query)
//         //   const [vectorResults, keywordResults] = await Promise.all([
//           //     index.namespace("productdata").query({
//             //         vector: queryEmbedding,
//             //         topK: 3,
//             //         includeValues: true,
//             //     }),
//             //     keywordSearch(query),  //  BM25-based retrieval
//             // ]);
//             // const combinedResults = [...vectorResults.matches, ...keywordResults];
//             // const rankedResults = await reRankResults(query, combinedResults);
            
//             // return rankedResults.map((result: any) => result.metadata?.text || "").join("\n");
            
            
//         const queryEmbedding  = await embeddingModel.embedQuery(query)
//         const queryResponse = await index.namespace("productdata").query({
//             vector: queryEmbedding ,
//             topK: 3,
//             includeValues: true,
//         });

//         if (!queryResponse.matches || queryResponse.matches.length === 0) {
//             return "No relevant results found.";
//         }
//         const relevantTexts = queryResponse.matches
//             .map((match:any) => match.metadata?.text || "")
//             .join("\n");

//         return relevantTexts;

//     } catch (error) {
//         console.error("Error in similarity search:", error);
//         return "Error searching database.";
//     }
// }


// async function reRankResults(query: string, results: any[]): Promise<any[]> {
//   try {
//     // Format prompt as a proper message
//     const messages = [
//       new HumanMessage(`
//         Given the user query: "${query}", re-rank the following results in order of relevance:

//         Results:
//         ${results.map((res, i) => `${i + 1}. ${res.metadata?.text || "No text available"}`).join("\n")}

//         Return the results in a sorted JSON array format. Respond with ONLY a valid JSON array:
//         [{"rank": 1, "text": "Most relevant result"}, {"rank": 2, "text": "Next best result"}, ...]
//       `)
//     ];

//     // Use invoke instead of generateText
//     const response = await llm.invoke(messages);
    
//     // Extract content from the response
//     const responseText = response.content.toString();
    
//     // Find and extract the JSON portion from the response
//     const jsonMatch = responseText.match(/\[\s*\{[\s\S]*\}\s*\]/);
//     if (!jsonMatch) {
//       throw new Error("Could not extract JSON from response");
//     }
    
//     const rankedResults = JSON.parse(jsonMatch[0]);

//     // Map back to your original format
//     return rankedResults.map((item: any) => ({
//       metadata: { text: item.text },
//       // Preserve any other fields from original results if needed
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



// async function summarizeConversation(query: string, response: string): Promise<string> {
//   try {
//     // Create a chat with system message for better control
//     const messages = [
//       new SystemMessage(
//         "You are a precise summarization assistant. Condense conversations into single, " +
//         "informative sentences capturing the key question and answer. Be clear and concise."
//       ),
//       new HumanMessage(
//         `Summarize this conversation in ONE sentence only:
        
//         User: ${query}
        
//         Assistant: ${response}
//         `
//       )
//     ];
    
//     // Add timeout and retry logic
//     // const result = await Promise.race([
//     //   llm.invoke(messages),
//     //   new Promise((_, reject) => 
//     //     setTimeout(() => reject(new Error("Summarization timed out")), 10000)
//     //   )
//     // ]);
//     const result = await llm.invoke(messages);
    
//     const summary = result.content.toString().trim();
    
//     // Verify we got a reasonable summary
//     if (summary.length < 10) {
//       throw new Error("Summary too short");
//     }
    
//     return summary;
//   } catch (error) {
//     console.error("Error summarizing conversation:", error);
    
//     // Fallback summarization - take first sentence of response or truncate
//     const firstSentence = response.split(/[.!?]/).filter(s => s.trim().length > 0)[0];
//     if (firstSentence && firstSentence.length < 100) {
//       return firstSentence.trim() + "...";
//     }
//     return response.length > 120 ? response.substring(0, 117) + '...' : response;
//   }
// }


// async function generateResponse(query: string, context: string, history: string,campaignVariables:CampaignVariables): Promise<string> {
//   try {
//       const promptTemplate = ChatPromptTemplate.fromTemplate(`
//         You are a {communicationStyles} {jobRole} representing {overrideCompany}. Your name is {personaName}. 
//         You are a {jobRole} for the {campaignName} campaign with the objective to {campaignObjective}.
      
//         ## Core Responsibilities
//         - Act professionally as a {jobRole}
//         - Focus on selling the product based on provided product data and context
//         - Maintain a clear understanding of your role and campaign objectives
      
//         ## Communication Strategy
//         1. Introduction Stage
//         - Greet the prospect professionally
//         - Introduce yourself and your company
//         - Establish the purpose of the conversation
//         - Maintain a respectful and engaging tone
      
//         2. Prospect Qualification
//         - Determine if the prospect is the right contact
//         - Confirm their decision-making authority
//         - Assess their potential interest and needs
      
//         3. Value Proposition
//         - Clearly articulate product/service benefits
//         - Highlight unique selling points (USPs)
//         - Demonstrate how your offering solves specific problems
      
//         4. Needs Analysis
//         - Ask open-ended questions
//         - Actively listen to prospect's responses
//         - Identify pain points and challenges
      
//         5. Solution Presentation
//         - Customize solution based on discovered needs
//         - Use storytelling and relatable examples
//         - Provide concrete evidence of value
      
//         6. Objection Handling
//         - Anticipate and address potential concerns
//         - Use data, testimonials, and case studies
//         - Build trust through transparent communication
      
//         7. Closing
//         - Propose clear next steps
//         - Summarize key benefits
//         - Create a sense of mutual opportunity
      
//         ## Key Guidelines
//         - Tailor communication to prospect's industry and role
//         - Apply social proof and success stories
//         - Create urgency without being pushy
//         - Maintain professional and authentic interaction
      
//         ## Contact Information Disclaimer
//         If asked about contact source, state: "Contact information was obtained from public records."
      
//         ## Conversation Management
//         - Keep responses concise and engaging
//         - Avoid overwhelming the prospect with information
//         - Adapt communication style dynamically
      
//         ## Tools Usage
//         Tools can be used with the following format:
//         [Tool Usage Instructions - Placeholder for specific tool interaction guidelines]
      
//         ## Ethical Considerations
//         - Always be truthful
//         - Do not fabricate information
//         - Protect prospect's privacy
//         - Focus on genuine value creation
      
//         ## Conversation Tracking
//         When conversation concludes, output: <END_OF_CALL>
      
//         ## Dynamic Context
//         Previous Conversation: {history}
//         Campaign Details:
//         - Project: {overrideCompany}
//         - Description: {campaignObjective}
//         - Target Audience: Humans
      
//         ## Current Interaction
//         Query: {query}
//         Objective: {campaignObjective}
      
//         Begin interaction as {personaName}, a {jobRole} representing {overrideCompany}.
//       `);

//     const chain = promptTemplate.pipe(llm).pipe(new StringOutputParser());
    
//     // Determine if this is a first-time conversation based on history
//     const isFirstConversation = !history || history.trim() === '' || history.length==0 
    
//     const response = await chain.invoke({
//       query,
//       history,
//       context,
//       ...campaignVariables,
//       // If this is the first conversation, we might want to use the initial message as a reference point for the appropriate tone and style
//       initialMessage: isFirstConversation ? campaignVariables.initialMessage : "",
//       followUpMessage: !isFirstConversation ? campaignVariables.followUpMessage : ""
//     });

//     return response;
//     // need invoke a lot more stuff 
//     // if past conversation exists , dont introduce again , hello there again on a new conversation / reach out again , ie the user didnt reply or different campaign , or campagin rerun 
//     // on non suzzessful audience 

//   } catch (error) {
//     console.error("Error generating response:", error);
//     return "I'm sorry, I encountered an issue while processing your request. Please try again shortly.";
//   }
// }
