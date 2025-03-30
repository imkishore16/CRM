import { NextRequest, NextResponse } from "next/server";
import pc from "@/clients/pinecone";
import llm from "@/clients/llm";
import embeddingModel from "@/clients/embeddingModel";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import redis from "@/clients/redis";
import twilio from 'twilio';
import twilioClient from "@/clients/twilioClient";
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

export async function POST(req: NextRequest ) {
    try {
        const data= await req.json();
        const query = data.query as string;
        const mobileNumber="9445422734"
        console.log(query)
        if (!query) {
            return NextResponse.json({ error: "Query is required" }, { status: 400 });
        }

        const spaceId = 9
        const indexName="campaign"+spaceId;
        const index = pc.index(indexName , `https://${indexName}-${process.env.PINECONE_URL}`);

        console.log(1)
        const pastConversations = await fetchConversationHistory(query,mobileNumber,index);
        console.log("pastConversations : " , pastConversations)
        console.log(2)
        
        // const summarizedHistory = await summarizeConversation(pastConversations);
        const combinedConversations = pastConversations.join("\n");
        console.log("combinedConversations : " , combinedConversations)
        
        const relevantDocs = await similaritySearch(query, index);
        console.log("relevantDocs : ", relevantDocs)
        
        const campaignVariables = await handleCampaignVariables(index,spaceId || 9);

        const response = await generateResponse(query,relevantDocs,combinedConversations ,campaignVariables);
        console.log(5)
        
        await saveConversation(mobileNumber, query, response,index);
        console.log(6)


      return NextResponse.json({ message: response }, { status: 200 });
    } catch (error) {
        console.error("Error processing request:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}


async function saveConversation(
  mobileNumber: string, 
  query: string, 
  response: string, 
  index: any
): Promise<void> {
  try {
    // Create timestamps once to ensure consistency
    const queryId = `query_${Date.now()}`;
    const responseId = `resp_${Date.now()}`;
    const timestamp = new Date().toISOString();
    
    // Create embeddings for both query and response
    const [queryEmbedding, responseEmbedding] = await Promise.all([
      embeddingModel.embedQuery(query),
      embeddingModel.embedQuery(response)
    ]);
    
    const summary = await summarizeConversation(query, response);
    
    // Save query and response with their embeddings
    await index.namespace(mobileNumber).upsert([
      {
        id: queryId,
        values: queryEmbedding,
        metadata: {
          type: 'query',
          text: query,
          user_query: query,  // Adding this for consistency with fetch
          response_id: responseId,
          summary: summary,
          timestamp: timestamp,
        },
      },
      {
        id: responseId,
        values: responseEmbedding,
        metadata: {
          type: 'response',
          text: response,
          llm_reply: response,  // Adding this for consistency with fetch
          query_id: queryId,
          summary: summary,
          timestamp: timestamp,
        },
      }
    ]);
  } catch (error) {
    console.error("Error saving conversation:", error);
    throw error;  // Re-throw to allow caller to handle
  }
}

async function fetchConversationHistory(
  query: string, 
  mobileNumber: string, 
  index: any
): Promise<string[]> {
  try {
    const queryEmbedding = await embeddingModel.embedQuery(query);
    
    // Check if namespace exists
    const stats = await index.describeIndexStats();
    if (!stats.namespaces || !stats.namespaces[mobileNumber]) {
      console.log(`Namespace "${mobileNumber}" does not exist in index.`);
      return [];
    }
    
    const queryResponse = await index.namespace(mobileNumber).query({
      vector: queryEmbedding,
      topK: 10,
      includeMetadata: true,
    });
    
    if (!queryResponse.matches || queryResponse.matches.length === 0) {
      return [];
    }
    
    // Format and return conversations
    const conversations = queryResponse.matches.map((match: any) => {
      const metadata = match.metadata;
      // Use the consistent fields or fall back to text field
      const userQuery = metadata.user_query || metadata.text || "Unknown query";
      let llmReply = "Unknown reply";
      
      // For response types, use llm_reply or text
      if (metadata.type === 'response') {
        llmReply = metadata.llm_reply || metadata.text || "Unknown reply";
      }
      // For query types, try to find the corresponding response
      else if (metadata.type === 'query' && metadata.response_id) {
        // You might need to fetch the corresponding response separately
        // This is just a placeholder for the concept
        llmReply = "Response would need to be fetched separately";
      }
      
      return `User Query: ${userQuery}\nLLM Reply: ${llmReply}`;
    });
    
    return conversations;
  } catch (error) {
    console.error("Error fetching conversation history:", error);
    return [];
  }
}


async function handleCampaignVariables(index:any,spaceId:number): Promise<CampaignVariables>{
  const cacheKey = `campaign${spaceId}`;
  
  //If already present , just return
  const cachedData = await redis.get(cacheKey);
  if (cachedData) {
    console.log("cachedData :" , cachedData)
    return JSON.parse(cachedData);
  }

  // else get from vec db first
  const campaignVariables =await fetchCampaignDataFromVectorDB(index,spaceId)

  console.log("campaignVariables ;" , campaignVariables)
  
  //now store in redis then return
  await redis.set(cacheKey, JSON.stringify(campaignVariables), "EX", 7200);

  return campaignVariables;
}

// async function fetchCampaignDataFromVectorDB(index:any , spaceId: number): Promise<CampaignVariables> {
//   try {
    
//     const queryResponse = await index.namespace("variables").query({
//       filter: {source: "variables",},
//       topK: 1,
//       includeMetadata: true,
//       // Since values array is empty, we need an alternative approach:
//       // 1. Either provide a dummy vector of the right dimension
//       // 2. Or use Pinecone's metadata-only query if available
//       vector: new Array(384).fill(0), // Dummy vector (adjust dimension as needed)
//     });
    
//     // Check if we got any matches
//     if (queryResponse.matches && queryResponse.matches.length > 0 && queryResponse.matches[0].metadata) {
//         const metadata = queryResponse.matches[0].metadata;
      
//         // Convert the metadata to our CampaignVariables format
//         return {
//           campaignName: metadata.campaignName || "",
//           campaignType: metadata.campaignType || "",
//           overrideCompany: metadata.overrideCompany || "",
//           personaName: metadata.personaName || "",
//           jobRole: metadata.jobRole || "",
//           campaignObjective: metadata.campaignObjective || "",
//           communicationStyles: metadata.communicationStyles || "",
//           initialMessage: metadata.initialMessage || "",
//           followUpMessage: metadata.followUpMessage || ""
//         };
//     }
    
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

//   } catch (error) {
//     console.error("Error fetching campaign data from vector DB:", error);
//     // Return default values if there's an error
//     return {
//       campaignName:  "Default Campaign",
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
      // If this is the first conversation, we might want to use the initial message as a reference point for the appropriate tone and style
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




// summarizing the whole thread
// interface ChatMessage {
//   role: 'user' | 'assistant';
//   content: string;
// }

// async function summarizeConversation(messages: ChatMessage[]): Promise<string> {
//   try {
//     const conversation = messages.map(msg => `${msg.role}: ${msg.content}`).join('\n');
//     const prompt = `
//       Summarize the following conversation in one sentence:

//       ${conversation}

//       Summary:
//     `;

//     // Use the chat-based API to generate the summary
//     const result = await llm.invoke(prompt);
//     const summary = result.content; // Extract the generated content

//     return summary.trim();
//   } catch (error) {
//     console.error("Error summarizing conversation:", error);
//     return messages.map(msg => msg.content).join('\n'); // If Gemini fails, return the full conversation.
//   }
// }

// // Example usage
// (async () => {
//   const messages: ChatMessage[] = [
//     { role: 'user', content: "What is the capital of France?" },
//     { role: 'assistant', content: "The capital of France is Paris." },
//     { role: 'user', content: "What is the population of Paris?" },
//     { role: 'assistant', content: "The population of Paris is approximately 2.1 million." }
//   ];
//   const summary = await summarizeConversation(messages);
//   console.log("Summary:", summary);
// })();


//old  and simple
// async function summarizeConversation(query: string[]): Promise<string> {
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
