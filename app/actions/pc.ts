"use server"
import pc from "@/clients/pinecone";
import { fetchModelProvider } from "./prisma";
import { getLLM } from "@/clients/llm";
import { handleCampaignVariables } from "@/lib/serverUtils";
import { customFirstMessage } from "../api/campaign/route";
import { error } from "console";


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