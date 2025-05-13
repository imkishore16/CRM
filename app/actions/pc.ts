"use server"
import pc from "@/clients/pinecone";
import { fetchModelProvider } from "./prisma";
import { getLLM } from "@/clients/llm";
import { handleCampaignVariables } from "@/lib/serverUtils";
import { customFirstMessage } from "../api/campaign/route";
import { error } from "console";
import embeddingModel from "@/clients/embeddingModel";



export async function fetchIndex(spaceId: number, namespace?: string) {
    const indexName = "campaign" + spaceId;
    const index = pc.index(indexName, `https://${indexName}-${process.env.PINECONE_URL}`);
    
    if (namespace) {
        return index.namespace(namespace);
    }
    
    return index;
}

export async function fetchInitialMessage(spaceId: number ) {
    
    const indexName = "campaign" + spaceId;
    const index = pc.index(indexName, `https://${indexName}-${process.env.PINECONE_URL}`);
    const response = await index.namespace("variables").query({
        filter: {
          source: { $eq: "initialMessage" }
        },
        topK: 1,
        includeMetadata: true,
        vector: new Array(768).fill(0)
      });
      
      let initialMessage : any
      if (response.matches && response.matches.length > 0 && response.matches[0].metadata) {
        initialMessage = response.matches[0].metadata.value || "Hi";
      }
      return initialMessage
}


export async function getCustomInitialMessage(spaceId: number) {
  const parsedId = parseInt(spaceId.toString())

  const index = await fetchIndex( parsedId) // this may be sync
  const modelProvider = await fetchModelProvider(parsedId)
  const model = getLLM(modelProvider ?? 'gemini')

  const campaignVariables = await handleCampaignVariables(index, parsedId)
  const customInitialMessage = await customFirstMessage(index, model, "9445422734", campaignVariables)

  return customInitialMessage
}

export async function fetchCustomerData(index: any, mobileNumber: string) {
  console.log(`Fetching customer data for mobileNumber: ${mobileNumber}`);
  try {
    // Query the customerdata namespace (lowercase to match your embedding function)
    // Use the mobileNumber as the ID to fetch the exact vector
    const queryResult = await index.namespace("customerdata").fetch([mobileNumber]);
    const record = queryResult.records?.[mobileNumber];
    console.log("record metadata: ",record?.metadata?.data)
    return record?.metadata?.data || "no data found";
  }
  catch(e)
  {
    console.log("error fetching customer data : ",e)
    return
  }
  
}

export async function fetchProductLinks(index: any) {
  console.log("Fetching Product links...");
  try {
    const queryResponse = await index.namespace("links").query({
      topK: 100, // Adjust based on how many links you expect to have
      includeMetadata: true,
      vector: new Array(768).fill(0), // Dummy vector to get all results
      filter: {
        $or: [
          { "metadata.key": { $exists: true } },
          { "metadata.text": { $exists: true } }
        ]
      }
    });

    if (!queryResponse.matches || queryResponse.matches.length === 0) {
      console.log("No product links found");
      return [];
    }

    // Transform the response into a more usable format
    const links = queryResponse.matches.map((match: { 
      metadata?: { 
        key?: string; 
        text?: string; 
      }; 
      score?: number;
    }) => ({
      description: match.metadata?.key || '',
      url: match.metadata?.text || '',
      score: match.score
    }));

    console.log(`Found ${links.length} product links :` , links);
    return links;
  } catch (error) {
    console.error("Error fetching product links:", error);
    return [];
  }
}

interface CustomerData {
  name?: string;
  role?: string;
  company?: string;
  pain_points?: string[];
  interests?: string[];
  mobile_number: string;
  last_updated?: string;
  [key: string]: any; // Allow for additional fields
}

export async function saveCustomerData(index: any, data: CustomerData) {
  console.log("Saving customer data:", data);
  try {
    if (!data.mobile_number) {
      throw new Error("Mobile number is required to save customer data");
    }

    // Add timestamp
    const enrichedData = {
      ...data,
      last_updated: new Date().toISOString()
    };

    // Create a string representation of the data for embedding
    const dataString = Object.entries(enrichedData)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return `${key}: ${value.join(", ")}`;
        }
        return `${key}: ${value}`;
      })
      .join("\n");

    // Get embeddings for the customer data
    const embedding = await embeddingModel.embedQuery(dataString);

    // Prepare the vector for Pinecone
    const vector = {
      id: data.mobile_number,
      values: embedding,
      metadata: {
        data: enrichedData
      }
    };

    // Upsert the vector to Pinecone
    await index.namespace("customerdata").upsert([vector]);

    console.log("Successfully saved customer data for:", data.mobile_number);
    return true;
  } catch (error) {
    console.error("Error saving customer data:", error);
    return false;
  }
}