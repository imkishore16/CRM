import pc from "@/clients/pinecone";


async function initializePineConeDB(indexName: string) {
    try {
      const indexList = await pc.listIndexes();
      let indexExists = false;
      indexList.indexes?.forEach(index => {
        if (index.name === indexName) {
          indexExists = true;
          }
        });
        if(indexExists){
            return pc.index(indexName) 
        }

      await pc.createIndex({
          name: indexName,
          dimension: 384,
          metric: 'cosine',
          spec: { 
              serverless: { 
              cloud: 'aws', 
              region: 'us-east-1' 
              }
          } 
      });
      await pc.index(indexName).describeIndexStats();
      return pc.index(indexName);

    } catch (error) {
      console.error("Error initializing pineconeDB:", error);
      throw new Error("Failed to initialize PineconeDB.");
    }
}   

export default initializePineConeDB