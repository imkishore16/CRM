import * as fs from "fs";
import * as path from "path";
import { NextRequest,NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { Index, Pinecone } from "@pinecone-database/pinecone";
import { HfInference } from "@huggingface/inference";
import PDFParser from "pdf2json";
import pdf from "pdf-parse";
import embeddingModel from "@/client/embeddingModel";
import pc from "@/client/pinecone";
import { Buffer } from "buffer";
import pdfParse from 'pdf-parse';
import prisma from "@/lib/db";
export const runtime = 'nodejs' 


export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const spaceId = formData.get('spaceId') as string;
        const subFolder = formData.get('index') as string;
        const files = formData.getAll('files') as File[];

        console.log("Received files:", files.map(f => f.name));

        if (!spaceId || !subFolder || files.length === 0) {
            return NextResponse.json(
                { message: "Missing required fields or files" },
                { status: 400 }
            );
        }

        const indexName = subFolder + spaceId;
        const index = pc.index(indexName)
        if (subFolder==="productdata")
        {
            for (const file of files) {
                try {
                    const content = await readFileContent(file);
                    console.log(`Successfully read file ${file.name}, content length: ${content.length}`);
                    const result = await embedProductData(file, index);
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
        }
        else  // store customer data properly
        {
            for (const file of files) {
                try {
                    const result = await embedCustomerData(file,index,spaceId);
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


async function embedProductData(file: File, index: any): Promise<any> {
    try {
        console.log(file);
        const fileContent = await readFileContent(file);
        const chunkSize = 500; // Adjust based on the model's token limit
        const chunks = fileContent.match(new RegExp(`.{1,${chunkSize}}`, "g")) || [];

        const hf = new HfInference(process.env.HUGGINGFACE_API_KEY); 

        //use inbuilt method to embed all chucks
        const embeddedData = embeddingModel.embedDocuments(chunks)
        
        // Generate embeddings for each chunk
        const embeddings: number[][] = [];
        for (const chunk of chunks) {
            const response = await hf.featureExtraction({
                model: "sentence-transformers/all-MiniLM-L6-v2",
                inputs: chunk,
            });

            if (Array.isArray(response)) {
                embeddings.push(response as number[]);
                console.log("chunck embedded")
            } else {
                throw new Error("Unexpected response format from embedding model.");
            }
        }
        console.log("embeddedData")
        console.log(embeddedData)
        console.log("embeddings")
        console.log(embeddings)
        
        const ids = chunks.map((_, index) => `chunk_${index}`);
        console.log(ids)
        console.log(index)
        console.log("going to upsert")

        await index.namespace("productdata").upsert({
            vectors: ids.map((id, index) => ({
                id, 
                values: embeddings[index], 
                metadata: {
                    chunk: index + 1,
                    text: chunks[index], // Optionally store the text chunk
                }
            })),
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


async function embedCustomerData(file: File, index: any,spaceId : string) {
    try{
        const pdfData = await readFileContent(file);
    
        // Regex to match "MobileNumber: User Data"
        const regex = /(\d{10})\s*:\s*(.+?)(?=\n\d{10}\s*:|$)/;
        const matches = [...pdfData.matchAll(regex)];
    
        for (const match of matches) {
        const mobileNumber = match[1];
        const userData = match[2];
    
        console.log(`Found: ${mobileNumber} -> ${userData}`);
    
        const embedding = await embeddingModel.embedQuery(userData);
        
        //   await prisma.spaceCustomer.create({
        //     data: {
        //       spaceId: spaceId,
        //       mobileNumber: mobileNumber,
        //     },
        //   });

        // Store in Pinecone
        await index.upsert([
            {
            id: mobileNumber,
            values: embedding,
            metadata: { mobile: mobileNumber, data: userData },
            },
        ]);
        }
        return {
            success: true,
            message: "Embeddings successfully created and stored in Pinecone.",
        };
    }
    catch (error: any) {
        return { 
            success: false, 
            message: `Error: ${error.message}` 
        };
    }
    
  }
  


type SupportedFileType = "pdf"  | "txt" ;
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
                    console.log(data)
                    console.log("PDF parsed successfully, text length:", data.text.length);
                    
                    return data.text;
                } catch (error) {
                    console.error('Error parsing PDF:', error);
                    
                    throw new Error(`Failed to parse PDF: ${error}`);
                } 
            // case "pdf2":
            //     const pdfParser = new PDFParser();
            //     pdfParser.on("pdfParser_dataError", (errData: any) =>
            //         console.error(errData.parserError)
            //     );
            //     pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
            //         console.log(pdfData);
            //         return pdfData
            //     });

            //     pdfParser.loadPDF(file);
            // case "pdf3":
            //     file.arrayBuffer().then((dataBuffer) => {
            //         pdf(dataBuffer).then(function (data) {
            //           // Process the PDF data here
            //           console.log(data);
            //         }).catch((err) => {
            //           console.error('Error processing PDF:', err);
            //         });
            //       }).catch((err) => {
            //         console.error('Error reading file as ArrayBuffer:', err);
            //       });

                // pdf(dataBuffer).then(function (data) {

                // console.log(data.numpages);
                // // number of rendered pages
                // console.log(data.numrender);
                // // PDF info
                // console.log(data.info);
                // // PDF metadata
                // console.log(data.metadata);
                // // PDF.js version
                // console.log(data.version);
                // console.log(data.text);
                // })
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



