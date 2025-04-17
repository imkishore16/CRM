"use server"
import pc from "@/clients/pinecone";

export async function fetchInitialMessage(spaceId: number ) {
    
    const indexName = "campaign" + spaceId;
    const index = pc.index(indexName, `https://${indexName}-${process.env.PINECONE_URL}`);
    const response = await index.namespace("variables").query({
        filter: {
          source: { $eq: "initialMessage" }
        },
        topK: 1,
        includeMetadata: true,
        vector: new Array(384).fill(0)
      });
      
      let initialMessage : any
      if (response.matches && response.matches.length > 0 && response.matches[0].metadata) {
        initialMessage = response.matches[0].metadata.value || "Hi";
      }
      return initialMessage
}
