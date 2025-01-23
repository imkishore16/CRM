import * as fs from 'fs';
import * as path from 'path';

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

