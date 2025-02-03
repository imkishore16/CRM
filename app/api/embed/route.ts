import * as fs from "fs";
import * as path from "path";
import { NextRequest,NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { Index, Pinecone } from "@pinecone-database/pinecone";
import { HfInference } from "@huggingface/inference";

import { Buffer } from "buffer";
import * as XLSX from "xlsx";
import * as mammoth from "mammoth";

import pdfParse from 'pdf-parse';

export const runtime = 'nodejs' 


export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const userId = formData.get('userId') as string;
        const subFolder = formData.get('subFolder') as string;
        const files = formData.getAll('files') as File[];

        console.log("Received files:", files.map(f => f.name));

        if (!userId || !subFolder || files.length === 0) {
            return NextResponse.json(
                { message: "Missing required fields or files" },
                { status: 400 }
            );
        }

        const indexName = subFolder + userId;
        const index = await initializePineConeDB(indexName);

        for (const file of files) {
            try {
                const content = await readFileContent(file);
                console.log(`Successfully read file ${file.name}, content length: ${content.length}`);
                const result = await fileToEmbeddings(file, index);
                if (!result.success) {
                    console.error(`Failed to process file ${file.name}:`, result.message);
                    return NextResponse.json(
                        { message: result.message },
                        { status: 500 }
                    );
                }
            } catch (error) {
                console.error(`Error processing file ${file.name}:`, error);
                return NextResponse.json(
                    { message: `Error processing file ${file.name}: ${error}` },
                    { status: 500 }
                );
            }
        }

        return NextResponse.json(
            { message: "Files uploaded successfully" },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Error in POST handler:", error);
        return NextResponse.json(
            { message: `Error processing files: ${error.message}` },
            { status: 500 }
        );
    }
}


async function initializePineConeDB(indexName: string) {
    try {
      const pc = new Pinecone({apiKey:process.env.PINECONE_API_KEY??""})
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
          dimension: 1024,
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


async function fileToEmbeddings(file: File, index: any): Promise<any> {
    try {
        console.log(file);
        const fileContent = await readFileContent(file);
        const chunkSize = 500; // Adjust based on the model's token limit
        const chunks = fileContent.match(new RegExp(`.{1,${chunkSize}}`, "g")) || [];

        const hf = new HfInference(process.env.HUGGINGFACE_API_KEY); 

        // Generate embeddings for each chunk
        const embeddings: number[][] = [];
        for (const chunk of chunks) {
            const response = await hf.featureExtraction({
                model: "sentence-transformers/all-MiniLM-L6-v2",
                inputs: chunk,
            });

            if (Array.isArray(response) && Array.isArray(response[0])) {
                embeddings.push(response[0] as number[]);
            } else {
                throw new Error("Unexpected response format from embedding model.");
            }
        }
  
        const ids = chunks.map((_, index) => `chunk_${index}`);
        await index.upsert({  // Changed from add to upsert
            vectors: {
                ids,
                embeddings,
                metadatas: chunks.map((chunk, index) => ({
                    chunk: index + 1,
                })),
                documents: chunks,
            }
        });

        return {
            success: true,
            message: "Embeddings successfully created and stored in Pinecone.",
        };
    } catch (error: any) {
        return { 
            success: false, 
            message: `Error: ${error.message}` 
        };
    }
}



type SupportedFileType = "pdf"  | "txt";
async function readFileContent(file: File): Promise<string> {
    try {
        console.log("Reading file content:", file.name);

        const fileExtension = file.name.includes(".")
            ? (file.name.split(".").pop()?.toLowerCase() as SupportedFileType)
            : null;

        if (!fileExtension || !["pdf", "txt"].includes(fileExtension)) {
            throw new Error(`Unsupported file type: ${file.name}`);
        }

        const arrayBuffer = await file.arrayBuffer();

        switch (fileExtension) {
            case "pdf":
                try {
                    console.log("Starting PDF parse...");
                    const pdfBuffer = await file.arrayBuffer();
                    console.log("PDF buffer created, size:", pdfBuffer.byteLength);
                    
                    const buffer = Buffer.from(pdfBuffer);
                    console.log("Buffer created, size:", buffer.length);
                    
                    const data = await pdfParse(buffer);
                    console.log("PDF parsed successfully, text length:", data.text.length);
                    
                    return data.text;
                } catch (error) {
                    console.error('Error parsing PDF:', error);
                    
                    throw new Error(`Failed to parse PDF: ${error}`);
                } 

            case "txt":
                return await file.text();

            default:
                throw new Error(`Unsupported file type: ${fileExtension}`);
        }
    } catch (error) {
        console.error("Error in readFileContent:", error);
        throw error;
    }
}

export async function GET(req: NextRequest) {
    return NextResponse.json(
        { 
          message: "Files uploaded successfully", 
        },
        { status: 200 }
    );
}

// -----------------------------------------






//     // Initialize embedding model
//     const embeddings = new HuggingFaceTransformersEmbeddings({
//       modelName: 'all-MiniLM-L6-v2'
//     });

//   await collection.add({
//     ids: ['doc1'],
//     documents: ['Your document text here'],
//     metadatas: [{ source: 'initial_document' }]
//   });



