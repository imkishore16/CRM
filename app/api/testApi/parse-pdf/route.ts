import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import PDFParser from "pdf2json";

export async function POST(req: NextRequest) {
  try {
    const formData: FormData = await req.formData();
    const uploadedFiles = formData.getAll("filepond");
    let fileName = "";
    let parsedText = "";

    if (uploadedFiles && uploadedFiles.length > 0) {
      const uploadedFile = uploadedFiles[0]; // Use the first uploaded file

      // Check if uploadedFile is of type File
      if (uploadedFile instanceof File) {
        console.log("Uploaded file is of type File");

        // Generate a unique filename
        fileName = uploadedFile.name;

        // Convert the uploaded file into a temporary file
        const tempFilePath = `/tmp/${fileName}.pdf`;

        // Convert ArrayBuffer to Buffer
        const fileBuffer = Buffer.from(await uploadedFile.arrayBuffer());

        // Save the buffer as a file
        await fs.writeFile(tempFilePath, fileBuffer);

        // Parse the PDF file
        parsedText = await new Promise((resolve, reject) => {
          const pdfParser = new (PDFParser as any)(null, 1);
          
          pdfParser.on("pdfParser_dataError", (errData: any) => {
            console.error(errData.parserError);
            reject(errData.parserError);
          });

          pdfParser.on("pdfParser_dataReady", () => {
            const text = (pdfParser as any).getRawTextContent();
            resolve(text);
          });

          pdfParser.loadPDF(tempFilePath);
        });

        // Clean up the temporary file
        try {
          await fs.unlink(tempFilePath);
        } catch (unlinkError) {
          console.error("Error cleaning up temporary file:", unlinkError);
        }
      } else {
        console.log("Uploaded file is not in the expected format.");
        return NextResponse.json({ error: "Invalid file format." });
      }
    } else {
      console.log("No files found.");
      return NextResponse.json({ error: "No files uploaded." });
    }

    return NextResponse.json({ parsedText, fileName });
  } catch (error) {
    console.error("Error processing PDF:", error);
    return NextResponse.json(
      { error: "Failed to process the PDF file." },
      { status: 500 }
    );
  }
}