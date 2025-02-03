

import PdfParse, * as pdf from 'pdf-parse';
import * as XLSX from 'xlsx';
import * as mammoth from 'mammoth';




type SupportedFileType = 'pdf' | 'xlsx' | 'docx' | 'txt';

export async function readFileContent(file: File): Promise<string> {
  console.log("readFilecontent")
 const fileExtension = file.name.split('.').pop()?.toLowerCase() as SupportedFileType;

 switch (fileExtension) {
   case 'pdf':
     const pdfBuffer = await file.arrayBuffer();
     const pdfData = await PdfParse(Buffer.from(pdfBuffer));
     return pdfData.text;

   case 'xlsx':
     const xlsxBuffer = await file.arrayBuffer();
     const workbook = XLSX.read(xlsxBuffer, { type: 'buffer' });
     const sheetName = workbook.SheetNames[0];
     const worksheet = workbook.Sheets[sheetName];
     return XLSX.utils.sheet_to_txt(worksheet);

   case 'docx':
     const docxBuffer = await file.arrayBuffer();
     const { value } = await mammoth.extractRawText({ 
       buffer: Buffer.from(docxBuffer) 
     });
     return value;

   case 'txt':
     return await file.text();

   default:
     throw new Error(`Unsupported file type: ${fileExtension}`);
 }
}
