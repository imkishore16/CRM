import { NextRequest, NextResponse } from "next/server";
import pc from "@/clients/pinecone";
import llm from "@/clients/llm";
import embeddingModel from "@/clients/embeddingModel";
import prisma from "@/lib/db";
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

const DEBOUNCE_SECONDS = 2;
const REDIS_MESSAGE_PREFIX = 'whatsapp:pending:';

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

        //TODO : move this to redis
        const spaceCustomer = await prisma.spaceCustomer.findFirst({
          where: { mobileNumber: mobileNumber },
          select: { spaceId: true },
        });

      const spaceId = spaceCustomer?.spaceId ?? 0;
      // Create a unique key for this user based on spaceId and mobileNumber
      const userKey = `${REDIS_MESSAGE_PREFIX}${spaceId}:${mobileNumber}`;
      const processingKey = `${userKey}:processing`;

      await addMessageToRedis(userKey, query);

      const isProcessing = await redis.get(processingKey);

      if (!isProcessing) {
        // Set processing flag with expiration
        await redis.set(processingKey, "true", "EX", DEBOUNCE_SECONDS);
        
        // Schedule processing after debounce period
        setTimeout(async () => {
            await processAggregatedMessages(mobileNumber, spaceId);
        }, DEBOUNCE_SECONDS * 1000);
    }

        // const indexName="campaign"+spaceId;
        // const index = pc.index(indexName , `https://${indexName}-${process.env.PINECONE_URL}`);
        // const pastConversations = await fetchConversationHistory(query,mobileNumber,index);
        // const combinedConversations = pastConversations.join("\n");
        // const relevantDocs = await similaritySearch(query, index);
        // const campaignVariables = await handleCampaignVariables(index,spaceId || 0);
        // const response = await generateResponse(query,relevantDocs,combinedConversations ,campaignVariables);
        
        // await saveConversation(mobileNumber, query, response,index); // in vec Db
        // save conversation in redis
        // save conversation in db from redis 
        // await prisma.conversations.create({
        //   data: {
        //       spaceId: spaceId,
        //       mobileNumber: mobileNumber,
        //       user:query, 
        //       llm:response,
        //   },
        // })
        
        // await twilioClient.messages.create({
        //   body: response,
        //   from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`, 
        //   to: `whatsapp:${mobileNumber}` 
        // });

        return NextResponse.json({ message: "Message recived and replied" }, { status: 200 });

    } catch (error) {
        console.error("Error processing request:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}


async function saveConversationToVecDb(mobileNumber: string, query: string, response: string, index: any): Promise<void> {
  try {
    const [queryEmbedding, responseEmbedding] = await Promise.all([
      embeddingModel.embedQuery(query),
      embeddingModel.embedQuery(response)
    ]);
    
    const summary = await summarizeConversation(query, response);
    
    await index.namespace(mobileNumber).upsert([
      {
        id: `query_resp_${Date.now()}`, 
        values: queryEmbedding,
        metadata: {
          type: 'query',
          query: query,
          resposne: response,
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

async function fetchEnhancedConversationHistory(query: string, mobileNumber: string, index: any): Promise<string[]> {
  try {
    const recentConversations = await fetchRecentConversations(mobileNumber, 3); // Last 3 exchanges
    const allConversations = [...recentConversations];
    
    const similarConversations = await fetchSimilarConversations(query, mobileNumber, index);
    
    
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

async function fetchSimilarConversations(query:string , mobileNumber: string , index:any):Promise<Array<{
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

async function fetchRecentConversations(mobileNumber: string , limit : number): Promise<Array<{
  query: string;
  response: string;
  timestamp: string;
}>> {
  try {
    // Query the database for the most recent conversations
    const recentConversations = await prisma.conversations.findMany({
      where: {
        mobileNumber: mobileNumber
      },
      orderBy: {
        createdAt: 'desc' 
      },
      take: limit
    });
    
    // Format the data for consistency with vector retrieval
    return recentConversations.map(conv => ({
      query: conv.user,
      response: conv.llm,
      timestamp: conv.createdAt.toISOString(),
    })).reverse(); // Reverse to get chronological order (oldest first)
    
  } catch (error) {
    console.error("Error fetching recent conversations:", error);
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


async function addMessageToRedis(userKey: string, message: string): Promise<void> {
  const timestamp = Date.now();
  // Store as a list of timestamped messages
  await redis.rpush(userKey, JSON.stringify({ message, timestamp }));
  // Set expiration on the key to auto-cleanup (15 seconds should be plenty)
  await redis.expire(userKey, 15);
}

async function processAggregatedMessages(mobileNumber: string, spaceId: number): Promise<void> {
  const userKey = `${spaceId}:${mobileNumber}`;
  const processingKey = `${userKey}:processing`;
  
  try {
      // Get all messages
      const messageItems = await redis.lrange(userKey, 0, -1);
      
      if (messageItems.length === 0) {
          return;
      }
      
      const messages = messageItems.map(item => JSON.parse(item).message);
      const combinedQuery = messages.join(" ");
      
      console.log(`Processing aggregated messages for ${mobileNumber}:`, combinedQuery);
      
      // Process the query using your existing logic
      const indexName = "campaign" + spaceId;
      const index = pc.index(indexName, `https://${indexName}-${process.env.PINECONE_URL}`);
      
      const pastConversations = await fetchEnhancedConversationHistory(combinedQuery, mobileNumber, index);
      const combinedConversations = pastConversations.join("\n");
      const relevantDocs = await similaritySearch(combinedQuery, index);
      const campaignVariables = await handleCampaignVariables(index, spaceId);
      const response = await generateResponse(combinedQuery, relevantDocs, combinedConversations, campaignVariables);
      
      // Save the conversation
      await saveConversationToVecDb(mobileNumber, combinedQuery, response, index);
      
      await prisma.conversations.create({
          data: {
              spaceId: spaceId,
              mobileNumber: mobileNumber,
              user: combinedQuery, 
              llm: response,
          },
      });
      
      // Send the response via Twilio
      await twilioClient.messages.create({
          body: response,
          from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`, 
          to: `whatsapp:${mobileNumber}` 
      });
      
      // Clean up Redis after processing
      await redis.del(userKey);
      await redis.del(processingKey);
      
  } catch (error) {
      console.error(`Error processing messages for ${mobileNumber}:`, error);
      // Clean up to prevent stuck messages
      await redis.del(processingKey);
  }
}

async function fetchCampaignDataFromVectorDB(index: any, spaceId: number): Promise<CampaignVariables> {
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


async function reRankResults(query: string, results: any[]): Promise<any[]> {
  try {
    const messages = [
      new HumanMessage(`
        Given the user query: "${query}", re-rank the following results in order of relevance:

        Results:
        ${results.map((res, i) => `${i + 1}. ${res.metadata?.text || "No text available"}`).join("\n")}

        Return the results in a sorted JSON array format. Respond with ONLY a valid JSON array:
        [{"rank": 1, "text": "Most relevant result"}, {"rank": 2, "text": "Next best result"}, ...]
      `)
    ];

    const response = await llm.invoke(messages);
    
    const responseText = response.content.toString();
    
    const jsonMatch = responseText.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (!jsonMatch) {
      throw new Error("Could not extract JSON from response");
    }
    
    const rankedResults = JSON.parse(jsonMatch[0]);

    return rankedResults.map((item: any) => ({
      metadata: { text: item.text },
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

async function generateResponse(query: string, context: string, history: string,campaignVariables:CampaignVariables): Promise<string> {
  try {
    
    const promptTemplate = ChatPromptTemplate.fromTemplate(`
      You are a {communicationStyles} {jobRole} representing {overrideCompany}. Your name is {personaName}. 
      You are a {jobRole} for the {campaignName} campaign with the objective to {campaignObjective}.
    
      ## Core Responsibilities
      - Act professionally as a {jobRole}
      - Focus on selling the product based on provided product data and context
      - Maintain a clear understanding of your role and campaign objectives
    
      ## Communication Strategy
      1. Introduction Stage
      - Greet the prospect professionally
      - Introduce yourself and your company
      - Establish the purpose of the conversation
      - Maintain a respectful and engaging tone
    
      2. Prospect Qualification
      - Determine if the prospect is the right contact
      - Confirm their decision-making authority
      - Assess their potential interest and needs
    
      3. Value Proposition
      - Clearly articulate product/service benefits
      - Highlight unique selling points (USPs)
      - Demonstrate how your offering solves specific problems
    
      4. Needs Analysis
      - Ask open-ended questions
      - Actively listen to prospect's responses
      - Identify pain points and challenges
    
      5. Solution Presentation
      - Customize solution based on discovered needs
      - Use storytelling and relatable examples
      - Provide concrete evidence of value
    
      6. Objection Handling
      - Anticipate and address potential concerns
      - Use data, testimonials, and case studies
      - Build trust through transparent communication
    
      7. Closing
      - Propose clear next steps
      - Summarize key benefits
      - Create a sense of mutual opportunity
    
      ## Key Guidelines
      - Tailor communication to prospect's industry and role
      - Apply social proof and success stories
      - Create urgency without being pushy
      - Maintain professional and authentic interaction
    
      ## Contact Information Disclaimer
      If asked about contact source, state: "Contact information was obtained from public records."
    
      ## Conversation Management
      - Keep responses concise and engaging
      - Avoid overwhelming the prospect with information
      - Adapt communication style dynamically
    
      ## Tools Usage
      Tools can be used with the following format:
      [Tool Usage Instructions - Placeholder for specific tool interaction guidelines]
    
      ## Ethical Considerations
      - Always be truthful
      - Do not fabricate information
      - Protect prospect's privacy
      - Focus on genuine value creation
    
      ## Conversation Tracking
      When conversation concludes, output: <END_OF_CALL>
    
      ## Dynamic Context
      Previous Conversation: {history}
      Campaign Details:
      - Project: {overrideCompany}
      - Description: {campaignObjective}
      - Target Audience: Humans
    
      ## Current Interaction
      Query: {query}
      Objective: {campaignObjective}
    
      Begin interaction as {personaName}, a {jobRole} representing {overrideCompany}.
    `);

    const chain = promptTemplate.pipe(llm).pipe(new StringOutputParser());
    
    // Determine if this is a first-time conversation based on history
    const isFirstConversation = !history || history.trim() === '' || history.length==0 
    
    const response = await chain.invoke({
      query,
      history,
      context,
      ...campaignVariables,
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