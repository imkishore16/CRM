// // src/lib/serverUtils.ts (partial implementation showing LLM usage)
// import { getLLM } from "@/clients/llm";
// import { PineconeIndex } from "@/types/pinecone";

// type CampaignVariables = {
//   campaignName: string;
//   campaignType: string;
//   overrideCompany: string;
//   personaName: string;
//   jobRole: string;
//   campaignObjective: string;
//   communicationStyles: string;
//   initialMessage: string;
//   followUpMessage: string;
// };

// /**
//  * Generate a response based on query, context, history and campaign variables
//  */
// export async function generateResponse(
//   llmInstance: any,
//   query: string, 
//   context: string, 
//   history: string,
//   campaignVariables: CampaignVariables
// ): Promise<string> {
//   try {
//     const unifiedLLM = llmInstance; // This is already a UnifiedLLM instance

//     // Determine if this is a first-time conversation based on history
//     const isFirstConversation = !history || history.trim() === '' || history.length === 0;

//     // Use the template processing method
//     const response = await unifiedLLM.processWithTemplate(`
//       You are a {communicationStyles} {jobRole} representing {overrideCompany}. Your name is {personaName}. 
//       You are a {jobRole} for the {campaignName} campaign with the objective to {campaignObjective}.
    
//       ## Core Responsibilities
//       - Act professionally as a {jobRole}
//       - Focus on selling the product based on provided product data and context
//       - Maintain a clear understanding of your role and campaign objectives
    
//       ## Communication Strategy
//       1. Introduction Stage
//       - Greet the prospect professionally
//       - Introduce yourself and your company
//       - Establish the purpose of the conversation
//       - Maintain a respectful and engaging tone
    
//       2. Prospect Qualification
//       - Determine if the prospect is the right contact
//       - Confirm their decision-making authority
//       - Assess their potential interest and needs
    
//       3. Value Proposition
//       - Clearly articulate product/service benefits
//       - Highlight unique selling points (USPs)
//       - Demonstrate how your offering solves specific problems
    
//       4. Needs Analysis
//       - Ask open-ended questions
//       - Actively listen to prospect's responses
//       - Identify pain points and challenges
    
//       5. Solution Presentation
//       - Customize solution based on discovered needs
//       - Use storytelling and relatable examples
//       - Provide concrete evidence of value
    
//       6. Objection Handling
//       - Anticipate and address potential concerns
//       - Use data, testimonials, and case studies
//       - Build trust through transparent communication
    
//       7. Closing
//       - Propose clear next steps
//       - Summarize key benefits
//       - Create a sense of mutual opportunity
    
//       ## Key Guidelines
//       - Tailor communication to prospect's industry and role
//       - Apply social proof and success stories
//       - Create urgency without being pushy
//       - Maintain professional and authentic interaction
    
//       ## Contact Information Disclaimer
//       If asked about contact source, state: "Contact information was obtained from public records."
    
//       ## Conversation Management
//       - Keep responses concise and engaging
//       - Avoid overwhelming the prospect with information
//       - Adapt communication style dynamically
    
//       ## Ethical Considerations
//       - Always be truthful
//       - Do not fabricate information
//       - Protect prospect's privacy
//       - Focus on genuine value creation
    
//       ## Dynamic Context
//       Previous Conversation: {history}
//       Campaign Details:
//       - Project: {overrideCompany}
//       - Description: {campaignObjective}
//       - Target Audience: Humans
    
//       ## Current Interaction
//       Query: {query}
//       Objective: {campaignObjective}
//       Product Information: {context}
    
//       Begin interaction as {personaName}, a {jobRole} representing {overrideCompany}.
//     `, {
//       query,
//       history,
//       context,
//       ...campaignVariables,
//       // If this is the first conversation, use the initial message
//       initialMessage: isFirstConversation ? campaignVariables.initialMessage : "",
//       followUpMessage: !isFirstConversation ? campaignVariables.followUpMessage : ""
//     });

//     return response;
//   } catch (error) {
//     console.error("Error generating response:", error);
//     return "I'm sorry, I encountered an issue while processing your request. Please try again shortly.";
//   }
// }

// /**
//  * Fetch semantically similar conversations
//  */
// export async function fetchSimilarConversations(
//   llmInstance: any,
//   query: string, 
//   mobileNumber: string, 
//   index: any
// ): Promise<Array<{
//   id: string;
//   query: string;
//   response: string;
//   timestamp: string;
// }>> {
//   try {
//     const unifiedLLM = llmInstance;
//     const stats = await index.describeIndexStats();
    
//     if (stats.namespaces && stats.namespaces[mobileNumber]) {
//       console.log(`Namespace "${mobileNumber} exists".`);
//     } else {
//       console.log(`Namespace "${mobileNumber}" does not exist in index.`);
//       return [];
//     }
    
//     // Create embeddings for the query
//     const queryEmbedding = await unifiedLLM.embedText(query);
    
//     const queryResponse = await index.namespace(mobileNumber).query({
//       vector: queryEmbedding,
//       topK: 10, 
//       includeMetadata: true,
//     });

//     if (!queryResponse.matches || queryResponse.matches.length === 0) {
//       return [];
//     }
    
//     return queryResponse.matches
//       .filter((match: any) => match.metadata)
//       .map((match: any) => {
//         const metadata = match.metadata;
//         return {
//           id: match.id || "",
//           query: metadata.text || metadata.query || "",
//           response: metadata.response || "",
//           timestamp: metadata.timestamp || new Date().toISOString(),
//         };
//       });
//   } catch (error) {
//     console.error("Error fetching conversation history:", error);
//     return [];
//   }
// }

// /**
//  * Save conversation to vector database
//  */
// export async function saveConversationToVecDb(
//   llmInstance: any,
//   mobileNumber: string, 
//   query: string, 
//   response: string, 
//   index: any
// ): Promise<void> {
//   try {
//     const unifiedLLM = llmInstance;
//     const timestamp = new Date().toISOString();
//     const id = `${mobileNumber}-${timestamp}`;
    
//     // Generate summary if query is long
//     let summary = query;
//     if (query.length > 100) {
//       summary = await unifiedLLM.summarize(query, 50);
//     }
    
//     // Create embeddings
//     const queryEmbedding = await unifiedLLM.embedText(query);
    
//     // Save to vector DB
//     await index.namespace(mobileNumber).upsert([{
//       id,
//       values: queryEmbedding,
//       metadata: {
//         text: query,
//         summary: summary,
//         response: response,
//         timestamp: timestamp
//       }
//     }]);
    
//     console.log(`Saved conversation to vector DB with ID: ${id}`);
//   } catch (error) {
//     console.error("Error saving conversation to vector DB:", error);
//   }
// }

// /**
//  * Enhanced conversation history 
//  */
// export async function fetchEnhancedConversationHistory(
//   query: string, 
//   mobileNumber: string, 
//   index: any,
//   spaceId: number
// ): Promise<string[]> {
//   try {
//     // Get most recent conversations (for continuity)
//     const recentConversations = await fetchRecentConversations(mobileNumber, spaceId, 3);
    
//     // Get semantically similar conversations
//     const llmInstance = getLLM("gemini"); // Default fallback
//     const similarConversations = await fetchSimilarConversations(llmInstance, query, mobileNumber, index);
    
//     // Merge conversations (recent ones take precedence)
//     const allConversations = [...recentConversations];
    
//     // Add similar conversations that aren't already included
//     for (const conv of similarConversations) {
//       // Simple deduplication by checking for exact query matches
//       if (!allConversations.some(recent => recent.query === conv.query)) {
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

// /**
//  * Fetch recent conversations from database
//  */
// async function fetchRecentConversations(
//   mobileNumber: string, 
//   spaceId: number,
//   limit: number
// ): Promise<Array<{
//   query: string;
//   response: string;
//   timestamp: string;
// }>> {
//   try {
//     // Find user messages
//     const userMessages = await prisma.conversation.findMany({
//       where: {
//         mobileNumber: mobileNumber,
//         spaceId: spaceId,
//         sender: "USER"
//       },
//       orderBy: {
//         createdAt: 'desc'
//       },
//       take: limit
//     });
    
//     // Find corresponding bot responses
//     const result = [];
//     for (const userMsg of userMessages) {
//       const botResponse = await prisma.conversation.findFirst({
//         where: {
//           mobileNumber: mobileNumber,
//           spaceId: spaceId,
//           sender: "BOT",
//           createdAt: {
//             gt: userMsg.createdAt
//           }
//         },
//         orderBy: {
//           createdAt: 'asc'
//         }
//       });
      
//       if (botResponse) {
//         result.push({
//           query: userMsg.content,
//           response: botResponse.content,
//           timestamp: userMsg.createdAt.toISOString()
//         });
//       }
//     }
    
//     return result.reverse(); // Reverse to get chronological order (oldest first)
//   } catch (error) {
//     console.error("Error fetching recent conversations:", error);
//     return [];
//   }
// }

// /**
//  * Similarity search in vector DB
//  */
// export async function similaritySearch(
//   query: string, 
//   index: any
// ): Promise<string> {
//   try {
//     const llmInstance = getLLM("gemini"); // Default fallback
//     const queryEmbedding = await llmInstance.embedText(query);
    
//     const queryResponse = await index.namespace("productdata").query({
//       vector: queryEmbedding,
//       topK: 3,
//       includeValues: true,
//       includeMetadata: true
//     });

//     if (!queryResponse.matches || queryResponse.matches.length === 0) {
//       return "No relevant results found.";
//     }
    
//     const relevantTexts = queryResponse.matches
//       .map((match: any) => match.metadata?.text || "")
//       .join("\n");

//     return relevantTexts;
//   } catch (error) {
//     console.error("Error in similarity search:", error);
//     return "Error searching database.";
//   }
// }

// /**
//  * Handle campaign variables
//  */
// export async function handleCampaignVariables(
//   index: any,
//   spaceId: number
// ): Promise<CampaignVariables> {
//   const cacheKey = `campaign${spaceId}`;
  
//   const cachedData = await redis.get(cacheKey);
//   if (cachedData) {
//     console.log("Using cached campaign variables");
//     return JSON.parse(cachedData);
//   }

//   const campaignVariables = await fetchCampaignDataFromVectorDB(index, spaceId);
  
//   // Cache for 2 hours
//   await redis.set(cacheKey, JSON.stringify(campaignVariables), "EX", 7200);

//   return campaignVariables;
// }

// /**
//  * Fetch campaign data from vector DB
//  */
// async function fetchCampaignDataFromVectorDB(
//   index: any, 
//   spaceId: number
// ): Promise<CampaignVariables> {
//   try {
//     // Create a dummy vector for querying
//     const dummyVector = new Array(768).fill(0);
    
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
//     const fields = Object.keys(campaignData);
    
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

// /**
//  * Add message to Redis
//  */
// export async function addMessageToRedis(userKey: string, message: string): Promise<void> {
//   const timestamp = Date.now();
//   // Store as a list of timestamped messages
//   await redis.rpush(userKey, JSON.stringify({ message, timestamp }));
//   // Set expiration on the key to auto-cleanup (30 seconds should be plenty)
//   await redis.expire(userKey, 30);
// }