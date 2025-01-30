import * as fs from 'fs';
import * as path from 'path';

import PdfParse, * as pdf from 'pdf-parse';
import * as XLSX from 'xlsx';
import * as mammoth from 'mammoth';


export function createFolder(folderName: string, parentFolder?: string): void {
  try {
      const projectPath = path.resolve(__dirname);

      // Determine the target path for the folder
      const targetPath = parentFolder
          ? path.join(projectPath, parentFolder, folderName) // Subfolder inside parent
          : path.join(projectPath, folderName); // Folder at root level

      // Check if the folder already exists
      if (!fs.existsSync(targetPath)) {
          // Create the folder, including parent folders if necessary
          fs.mkdirSync(targetPath, { recursive: true });
          console.log(`Folder '${folderName}' created at: ${targetPath}`);
      } else {
          console.log(`Folder '${folderName}' already exists at: ${targetPath}`);
      }
  } catch (error) {
      console.error(`Error creating folder '${folderName}':`, error);
  }
}


type SupportedFileType = 'pdf' | 'xlsx' | 'docx' | 'txt';

export async function readFileContent(file: File): Promise<string> {
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
