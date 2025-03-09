import * as fs from "fs";
import * as path from "path";
import { NextRequest,NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { Index, Pinecone } from "@pinecone-database/pinecone";
import { HfInference } from "@huggingface/inference";
import PDFParser from "pdf2json";
import pdf from "pdf-parse";
import embeddingModel from "@/clients/embeddingModel";
import pc from "@/clients/pinecone";
import { Buffer } from "buffer";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import pdfParse from 'pdf-parse';
import prisma from "@/lib/db";
import { cookies } from "next/headers";
export const runtime = 'nodejs' 


export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const { searchParams } = new URL(req.url);

        // /api/embed?space=${spaceId}&index=${indexName}
        const spaceId = searchParams.get("spaceId") ?? ""; 
        const dataType = searchParams.get("indexName"); 
        const files = formData.getAll('files') as File[];

        console.log("Received files:", files.map(f => f.name));

        const indexName = dataType + spaceId;
        const index = pc.index(indexName , `https://${indexName}-bh2nb1e.svc.aped-4627-b74a.pinecone.io`);

        if (dataType==="productdata")
        {
            for (const file of files) {
                try {
                    const content = await readFileContent(file);
                    console.log(`Successfully read file ${file.name}, content length: ${content.length}`);
                    const result = await embedProductData(file, index);
                    // await embedCustomProductData2(file,index)
                    if (!result.success) {
                        console.error(`Failed to process file ${file.name}:`, result);
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
                    const result = await embedCustomerData(file,index,spaceId,"1");
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
        const fileContent = await readFileContent(file);
        if (!fileContent) {
            throw new Error("File content is empty or could not be read.");
        }
        
        const chunkSize = 500; 
        const overlap = 100; 
        const chunks = chunkText(fileContent, chunkSize, overlap);
        if (chunks.length === 0) {
            throw new Error("No chunks were created from the file content.");
        }
        console.log("++++++++++++++++++++++++++++++++++")
        console.log("embedProductData : " , chunks)
        const embeddedData = await embeddingModel.embedDocuments(chunks)
        
        const ids = chunks.map((_, index) => `chunk_${index}`);
        
        const vectors = ids.map((id, index) => ({
            id,
            values: embeddedData[index],
            metadata: {
                chunk: index + 1,
                text: chunks[index],
            },
        })) ;
        
        try {
            await index.namespace("productdata").upsert(vectors); 
            console.log("Records upserted successfully.");
        } catch (error) {
            console.error("Failed to upsert records:", error);
        }
        
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


async function embedCustomerData(file: File, index: any,spaceId : string,campaignId : string) {
    try{
        const data = await readFileContent(file);
        console.log("pdfData : " , data)
        // Regex to match "MobileNumber: User Data"
        const regex = /(\d{10})\s*:\s*([\s\S]+?)(?=\n\d{10}\s*:|$)/g;
        const matches = [...data.matchAll(regex)];
        console.log("matches" , matches)
        for (const match of matches) {
            const mobileNumber = match[1];
            const userData = match[2];
            
            console.log(`Found: ${mobileNumber} -> ${userData}`);
            
            const embedding = await embeddingModel.embedQuery(userData);
            
            await prisma.spaceCustomer.create({
            data: {
                spaceId: parseInt(spaceId, 10),
                mobileNumber: mobileNumber,
                campaignId : parseInt(campaignId, 10),
                status : false
            },
        });

        // Store in Pinecone
            await index.namespace("customerdata").upsert([
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

function chunkText(text: string, chunkSize: number, overlap: number): string[] {
const chunks: string[] = [];
let start = 0;

while (start < text.length) {
    const end = start + chunkSize;
    const chunk = text.slice(start, end);
    chunks.push(chunk);
    
    // Move the start position forward by (chunkSize - overlap)
    start += chunkSize - overlap;
}

return chunks;
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
        switch (fileExtension) {
            case "pdf":
                try {
                    // 1
                    const arrayBuffer = await file.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);
                    const data = await pdfParse(buffer);
                    console.log("ParesedData : ", data.text)
                    
                    // 2
                    file.arrayBuffer().then((dataBuffer) => {
                        pdf(buffer).then(function (data) {
                            // Process the PDF data here
                            console.log(data);
                        }).catch((err) => {
                            console.error('Error processing PDF:', err);
                        });
                        }).catch((err) => {
                        console.error('Error reading file as ArrayBuffer:', err);
                    });

                    pdf(buffer).then(function (data) {
                        console.log(data.text);
                    });


                    // 3 - uses langchaiun pdf parser
                    // Convert the file to a Blob
                    const blob = new Blob([file], { type: "application/pdf" });

                    // Use LangChain's PDFLoader to parse the PDF
                    const loader = new PDFLoader(blob);
                    const docs = await loader.load();

                    // Extract text from the parsed documents
                    const text = docs.map((doc) => doc.pageContent).join("\n");
                    console.log("Parsed PDF Data:", text);

                    return text;

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







async function embedCustomProductData2(file: File, index: any): Promise<any> {
    try {
      // Parse the file content
      const text = await file.text();
      const productData = parseProductDataFromText(text);
      console.log("++++++++++++++++++++++++++++++++++")
      console.log("embedProductData2 : " , productData)

      // Generate an embedding for the entire document
      const overallEmbedding = await embeddingModel.embedQuery(text);
      
      // Create structured data for storage
      const documentId = `product_${Date.now()}`;
      
      // Store the overall document with its embedding
      await index.namespace("productdata").upsert({
        vectors: [{
          id: documentId,
          values: overallEmbedding,
          metadata: {
            type: 'product_data',
            title: productData.campaignName || 'Untitled Campaign',
            content: text,
            timestamp: new Date().toISOString()
          }
        }]
      });
      
      // Store each section separately for more granular retrieval
      const sections = [
        { key: 'campaign_info', data: extractCampaignInfo(productData) },
        { key: 'company_info', data: extractCompanyInfo(productData) },
        { key: 'persona_info', data: extractPersonaInfo(productData) },
        { key: 'target_users', data: extractTargetUsers(productData) },
        { key: 'campaign_objective', data: productData.campaignObjective },
        { key: 'campaign_flow', data: productData.campaignFlow },
        { key: 'product_links', data: extractProductLinks(productData) },
        { key: 'messages', data: extractMessages(productData) }
      ];
      
      // Generate embeddings for each section and store
      const sectionVectors = await Promise.all(sections.map(async (section) => {
        const sectionText = JSON.stringify(section.data);
        const embedding = await embeddingModel.embedQuery(sectionText)
        
        return {
          id: `${documentId}_${section.key}`,
          values: embedding,
          metadata: {
            type: 'product_section',
            parent_id: documentId,
            section_type: section.key,
            content: sectionText,
            timestamp: new Date().toISOString()
          }
        };
      }));
      
      // Store all section vectors
      await index.upsert({
        vectors: sectionVectors
      });
      
      return {
        success: true,
        documentId,
        message: "Product data successfully embedded and stored"
      };
      
    } catch (error) {
      console.error("Error embedding product data:", error);
      return {
        success: false,
        error: error || "Failed to embed product data"
      };
    }
  }
  
  // Helper functions
  function parseProductDataFromText(text: string): any {
    // Extract structured data from the text format
    const productData: any = {};
    
    // Extract campaign name
    const campaignNameMatch = text.match(/Campaign Name\s*\n(.+?)(\n|$)/);
    productData.campaignName = campaignNameMatch ? campaignNameMatch[1].trim() : '';
    
    // Extract campaign type
    const campaignTypeMatch = text.match(/Campaign Type\s*\n(.+?)(\n|$)/);
    productData.campaignType = campaignTypeMatch ? campaignTypeMatch[1].trim() : '';
    
    // Extract company info
    productData.overrideCompany = text.includes("Override Company");
    const companyNameMatch = text.match(/Company Name[:\s]*\n(.+?)(\n|$)/);
    productData.companyName = companyNameMatch ? companyNameMatch[1].trim() : '';
    
    const aboutCompanyMatch = text.match(/About Company[:\s]*\n([\s\S]+?)(?=\d+\.\s|$)/);
    productData.aboutCompany = aboutCompanyMatch ? aboutCompanyMatch[1].trim() : '';
    
    // Extract persona info
    productData.overridePersona = text.includes("Override Persona");
    const personaNameMatch = text.match(/Persona Name[:\s]*\n(.+?)(\n|$)/);
    productData.personaName = personaNameMatch ? personaNameMatch[1].trim() : '';
    
    const personaRoleMatch = text.match(/Persona Job Role[:\s]*\n(.+?)(\n|$)/);
    productData.personaRole = personaRoleMatch ? personaRoleMatch[1].trim() : '';
    
    // Extract communication style
    const commStyleMatch = text.match(/Communication Style[:\s]*\n(.+?)(\n|$)/);
    productData.communicationStyle = commStyleMatch ? commStyleMatch[1].trim() : '';
    
    // Extract target users
    const titleMatch = text.match(/Title[:\s]*\n(.+?)(\n|$)/);
    productData.targetTitle = titleMatch ? titleMatch[1].trim() : '';
    
    const descriptionMatch = text.match(/Description[:\s]*\n(.+?)(\n|$)/);
    productData.targetDescription = descriptionMatch ? descriptionMatch[1].trim() : '';
    
    // Extract campaign objective
    const objectiveMatch = text.match(/Campaign Objective[:\s]*\n([\s\S]+?)(?=\d+\.\s|$)/);
    productData.campaignObjective = objectiveMatch ? objectiveMatch[1].trim() : '';
    
    // Extract campaign flow
    const flowMatch = text.match(/Campaign Flow[:\s]*\n([\s\S]+?)(?=\d+\.\s|$)/);
    productData.campaignFlow = flowMatch ? flowMatch[1].trim() : '';
    
    // Extract product links
    const linksSection = text.match(/Product Links[:\s]*\n([\s\S]+?)(?=\d+\.\s|$)/);
    if (linksSection) {
      const linksText = linksSection[1];
      const links = [];
      const linkMatches = linksText.matchAll(/Link Description[:\s]*\n(.+?)(\n|$)[\s\S]*?Link[:\s]*\n(.+?)(\n|$)/g);
      
      for (const match of linkMatches) {
        links.push({
          description: match[1].trim(),
          url: match[3].trim()
        });
      }
      productData.productLinks = links;
    } else {
      productData.productLinks = [];
    }
    
    // Extract messages
    const initialMsgMatch = text.match(/Initial Message[:\s]*\n([\s\S]+?)(?=\d+\.\s|$)/);
    productData.initialMessage = initialMsgMatch ? initialMsgMatch[1].trim() : '';
    
    const followupMsgMatch = text.match(/Followup Message[:\s]*\n([\s\S]+?)(?=\d+\.\s|$|C\.\s)/);
    productData.followupMessage = followupMsgMatch ? followupMsgMatch[1].trim() : '';
    
    return productData;
  }

  

  function extractCampaignInfo(data: any): any {
    return {
      name: data.campaignName,
      type: data.campaignType
    };
  }
  
  function extractCompanyInfo(data: any): any {
    return {
      override: data.overrideCompany,
      name: data.companyName,
      about: data.aboutCompany
    };
  }
  
  function extractPersonaInfo(data: any): any {
    return {
      override: data.overridePersona,
      name: data.personaName,
      role: data.personaRole,
      communicationStyle: data.communicationStyle
    };
  }
  
  function extractTargetUsers(data: any): any {
    return {
      title: data.targetTitle,
      description: data.targetDescription
    };
  }
  
  function extractProductLinks(data: any): any {
    return data.productLinks;
  }
  
  function extractMessages(data: any): any {
    return {
      initial: data.initialMessage,
      followup: data.followupMessage
    };
  }


  async function retrieveCampaignData(query: string, index: any): Promise<any> {
    // Generate embedding for the query
    const queryEmbedding = await embeddingModel.embedQuery(query)
    
    // Search for relevant sections or documents
    const searchResults = await index.query({
      vector: queryEmbedding,
      topK: 5,
      filter: { type: { $in: ['product_data', 'product_section'] } },
      includeMetadata: true
    });
    
    return searchResults.matches;
  }