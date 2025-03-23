import { NextRequest, NextResponse } from "next/server";
import pc from "@/clients/pinecone";
import llm from "@/clients/llm";
import embeddingModel from "@/clients/embeddingModel";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
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

export async function POST(req: NextRequest) {
    try {
        const data = await req.json();
        const query = data.query as string;
        const  to = data.to as string;     
        const  message  = data.body as string;     

        if (!query) {
            return NextResponse.json({ error: "Query is required" }, { status: 400 });
        }

        const spaceId = 9
        const mobileNumber= "9445422734"
        const indexName="campaign"+spaceId;
        const index = pc.index(indexName , `https://${indexName}-${process.env.PINECONE_URL}`);


        console.log(1)
        const pastConversations = await fetchConversationHistory(query,mobileNumber,index);
        console.log(2)
        
        // const summarizedHistory = await summarizeConversation(pastConversations);
        const combinedConversations = pastConversations.join("\n");
        console.log(3)
        
        const relevantDocs = await similaritySearch(query, index);
        console.log(4)
        
        const campaignVariables = await handleCampaignVariables(index,spaceId || 0);


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


async function saveConversation(mobileNumber: string, query: string, response: string, index: any): Promise<void> {
  try {
    // Create embeddings for both query and response
    const [queryEmbedding, responseEmbedding] = await Promise.all([
      embeddingModel.embedQuery(query),
      embeddingModel.embedQuery(response)
    ]);
    
    const summary = await summarizeConversation(query, response);
    
    // Save query with its embedding
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




async function generateResponse(query: string, context: string, history: string,campaignVariable:CampaignVariables): Promise<string> {
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
