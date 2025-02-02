import * as fs from "fs";
import * as path from "path";
import { NextRequest,NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { readFileContent } from '@/lib/serverUtils';
import { Pinecone } from "@pinecone-database/pinecone";


// import { Pipeline } from '@xenova/transformers';
import { ChromaClient, Collection } from "chromadb";

// import { HfInference } from "@huggingface/inference";

export async function POST(req: NextRequest) {
    
    const formData = await req.formData();
    const userId = formData.get('userId') as string;
    const subFolder = formData.get('subFolder') as string;
    const files = formData.getAll('files') as File[];

    console.log(files)


    if (!userId || !subFolder || files.length === 0) {
        return NextResponse.json(
            { message: "Missing required fields or files" },
            { status: 400 }
        );
    }
    console.log("initializing chromdb")
    const dbPath=path.join(process.cwd(),"storage")
    console.log(dbPath)
    const collection = await initializePineConeDB(subFolder,dbPath)
    // for (const file of files) {
    //     fileToEmbeddings(file,collection)
    // }
    return NextResponse.json(
        { 
          message: "Files uploaded successfully", 
        },
        { status: 200 }
      );
}










async function initializePineConeDB(indexName: string, dbPath: string) {
    try {
      const pc = new Pinecone({apiKey:process.env.PINE_CONE_API_KEY??""})
      
      const index = pc.index(indexName)

      if(index!=null)
        return index

      await pc.createIndex({
          name: indexName,
          dimension: 1024,
          metric: 'cosine',
          spec: { 
              serverless: { 
              cloud: 'aws', 
              region: 'us-east-1' 
              }
          } 
      });
  
    } catch (error) {
      console.error("Error initializing pineeconeDB:", error);
      throw new Error("Failed to initialize PineconeDB.");
    }
}   

type EmbeddingResult = {
  success: boolean;
  message: string;
  collection?: Collection;
};

// async function fileToEmbeddings(file: File ,collection:Collection): Promise<EmbeddingResult> {
//     try {
       

//         const fileContent= await readFileContent(file)
//         const chunkSize = 500; // Adjust based on the model's token limit
//         const chunks = fileContent.match(new RegExp(`.{1,${chunkSize}}`, "g")) || [];

//         // Initialize Hugging Face Inference API for embedding
//         const hf = new HfInference(process.env.HUGGINGFACE_API_KEY); 

//         // Generate embeddings for each chunk
//         const embeddings: number[][] = [];
//         for (const chunk of chunks) {
//             const response = await hf.featureExtraction({
//                 model: "sentence-transformers/all-MiniLM-L6-v2",
//                 inputs: chunk,
//             });

//             if (Array.isArray(response) && Array.isArray(response[0])) {
//                 embeddings.push(response[0] as number[]);
//             } else {
//                 throw new Error("Unexpected response format from embedding model.");
//             }
//         }
  
//         // Add the embeddings to the Chroma collection
//         const ids = chunks.map((_, index) => `$_chunk_${index}`);
//         await collection.add({
//             ids,
//             embeddings,
//             metadatas: chunks.map((chunk, index) => ({
//             chunk: index + 1,
//             //   source: file,
//             })),
//             documents: chunks,
//         });
//         return {
//             success: true,
//             message: "Embeddings successfully created and stored in Chroma.",
//             collection,
//         };
//         } 
//     catch (error: any) {
//         return { success: false, message: `Error: ${error.message}` };
//     }
// }



// -----------------------------------------





// async function initializeChromaDB(
//   dbPath: string, 
//   collectionName: string
// ) {
//   try {
//     // Create ChromaDB client with local persistent storage
//     const client = new chromadb.ChromaClient({
//       path: dbPath
//     });

//     // Initialize embedding model
//     const embeddings = new HuggingFaceTransformersEmbeddings({
//       modelName: 'all-MiniLM-L6-v2'
//     });

//     // Create or get collection
//     const collection = await client.createCollection({
//       name: collectionName,
//       embeddingFunction: embeddings
//     });

//     return { client, collection, embeddings };
//   } catch (error) {
//     console.error('ChromaDB initialization error:', error);
//     throw error;
//   }
// }

// // Example usage
// async function setupVectorStore() {
//   const { collection } = await initializeChromaDB(
//     './chromadb_storage', 
//     'my_document_collection'
//   );

//   // Add documents to collection
//   await collection.add({
//     ids: ['doc1'],
//     documents: ['Your document text here'],
//     metadatas: [{ source: 'initial_document' }]
//   });
// }

// import { ChromaClient, Collection } from "chromadb";
// import { SentenceTransformer } from "@huggingface/sentence-transformers";
// import * as fs from "fs";

// type EmbeddingResult = {
//   success: boolean;
//   message: string;
//   collection?: Collection;
// };

// async function fileToEmbeddingsLocalDB(
//   filePath: string,
//   collectionName: string,
//   dbPath: string // Path to the folder where the ChromaDB instance will be stored
// ): Promise<EmbeddingResult> {
//   try {
//     // Initialize local ChromaDB instance
//     const chroma = new ChromaClient({ path: dbPath });

//     // Connect to the collection or create it if it doesn't exist
//     const collection = await chroma.getOrCreateCollection({
//       name: collectionName,
//     });

//     // Read the file content
//     const fileContent = fs.readFileSync(filePath, "utf-8");
//     if (!fileContent) {
//       return { success: false, message: "File is empty or unreadable." };
//     }

//     // Split the file content into manageable chunks
//     const chunkSize = 500; // Adjust based on the model's token limit
//     const chunks = fileContent.match(new RegExp(`.{1,${chunkSize}}`, "g")) || [];

//     // Initialize SentenceTransformer
//     const transformer = await SentenceTransformer.create(
//       "sentence-transformers/all-MiniLM-L6-v2"
//     );

//     // Generate embeddings for each chunk
//     const embeddings = await transformer.embed(chunks);

//     // Add embeddings to the Chroma collection
//     const ids = chunks.map((_, index) => `${filePath}_chunk_${index}`);
//     await collection.add({
//       ids,
//       embeddings,
//       metadatas: chunks.map((chunk, index) => ({
//         chunk: index + 1,
//         source: filePath,
//       })),
//       documents: chunks,
//     });

//     return {
//       success: true,
//       message: "Embeddings successfully created and stored in local ChromaDB.",
//       collection,
//     };
//   } catch (error: any) {
//     return { success: false, message: `Error: ${error.message}` };
//   }
// }
