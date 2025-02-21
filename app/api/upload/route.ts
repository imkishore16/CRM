import { NextRequest,NextResponse } from "next/server";
import formidable from "formidable";
import * as fs from "fs";
import * as path from "path";

async function createFolder(folderName: string, parentFolder?: string): Promise<string> {
    const basePath = path.join(process.cwd(),"storage");
    console.log(basePath)
    const folderPath = parentFolder
        ? path.join(basePath, parentFolder, folderName)
        : path.join(basePath, folderName);

    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }

    return folderPath;
};

export const config = {
    api: {
        bodyParser: false,
    },
};

export async function POST(req: NextRequest) {
  
    try {
      const formData = await req.formData();
      const userId = formData.get('userId') as string;
      const subFolder = formData.get('index') as string;
      const files = formData.getAll('files') as File[];
        console.log(files.length)
      if (!userId || !subFolder || files.length === 0) {
        return NextResponse.json(
          { message: "Missing required fields or files" },
          { status: 400 }
        );
      }
      const uploadDir = await createFolder(subFolder,userId)
      for (const file of files) {
        const fileArrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(fileArrayBuffer);
  
        // Define the file path
        const filePath = path.join(uploadDir, file.name);
  
        // Write the file to the folder
        fs.writeFileSync(filePath, buffer);
      }
  
      console.log(files)

  
      return NextResponse.json(
        { 
          message: "Files uploaded successfully", 
        },
        { status: 200 }
      );
    } catch (error) {
      console.error("Error handling files:", error);
      return NextResponse.json(
        { message: "Failed to process files" },
        { status: 500 }
      );
    }
}

// export async function POST(req: NextRequest): Promise<NextResponse> {
//     const form = formidable({ multiples: true, keepExtensions: true });

//     const parseForm = (): Promise<{ fields: formidable.Fields; files: formidable.Files }> => {
//         return new Promise((resolve, reject) => {
//             form.parse(req as any, (err, fields, files) => {
//                 if (err) reject(err);
//                 resolve({ fields, files });
//             });
//         });
//     };

//     try {
//         const { fields, files } = await parseForm();
//         const userId = fields.userId as string;
//         const subFolder = fields.subFolder as string;

//         if (!userId || !subFolder) {
//             return NextResponse.json(
//                 { message: "Missing required fields: userId or subFolder" },
//                 { status: 400 }
//             );
//         }

//         const targetFolder = createFolder(subFolder, userId);

//         const uploadedFiles = Array.isArray(files.files) ? files.files : [files.files];
//         uploadedFiles.forEach((file: formidable.File) => {
//             const newFilePath = path.join(targetFolder, file.originalFilename || "file");
//             fs.renameSync(file.filepath, newFilePath);
//         });

//         return NextResponse.json(
//             { message: "Files uploaded successfully", folderPath: targetFolder },
//             { status: 200 }
//         );
//     } catch (error) {
//         console.error("Error handling files:", error);
//         return NextResponse.json(
//             { message: "Failed to process files" },
//             { status: 500 }
//         );
//     }

//     // form.parse(req , async (err, fields, files) => {
//     //     if (err) {
//     //       console.error("Error parsing form data:", err);
//     //       return NextResponse.json(
//     //             { message: "Failed to process files" },
//     //             { status: 500 }
//     //         );
//     //     }
  
//     //     // Accessing the fields
//     //     const { userId, subFolder } = fields; // These correspond to the fields appended in `formData`
//     //     console.log("User ID:", userId);
//     //     console.log("Sub Folder:", subFolder);
  
//     //     // Accessing the uploaded files
//     //     const uploadedFiles = files.files as formidable.File[] | formidable.File;
//     //     const filesArray = Array.isArray(uploadedFiles) ? uploadedFiles : [uploadedFiles];
  
//     //     // Save files or perform further processing
//     //     // filesArray.forEach((file) => {
//     //     //   const tempFilePath = file.filepath; // Temporary path of the file
//     //     //   const uploadDir = path.join(process.cwd(), "storage", userId as string, subFolder as string);
  
//     //     //   // Ensure upload directory exists
//     //     //   fs.mkdirSync(uploadDir, { recursive: true });
  
//     //     //   const newFilePath = path.join(uploadDir, file.originalFilename || "file");
//     //     //   fs.renameSync(tempFilePath, newFilePath); // Move the file to the upload directory
//     //     // });
  
//     //     return NextResponse.json(
//     //         { message: "Files uploaded succesfully" },
//     //         { status: 500 }
//     //     );
//     // });
//     return NextResponse.json(
//         { message: "Files uploaded succesfully" },
//         { status: 500 }
//     );
// }