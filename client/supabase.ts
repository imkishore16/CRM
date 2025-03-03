import { createClient } from "@supabase/supabase-js";
import path from "path";

// Initialize the Supabase client
const supabaseUrl = process.env.SUPABASE_URL  ?? "";
const supabaseKey = process.env.SUPABASE_ANON_KEY ?? "";
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;

async function uploadDocument(file:File, bucketName:string, filePath:string) {
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file);
  
      if (error) {
        throw error;
      }
  
      console.log("Document uploaded successfully:", data);
      return data;
    } catch (error) {
      console.error("Error uploading document:", error);
      throw error;
    }
}

async function downloadDocument(bucketName:string, filePath:string) {
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .download(filePath);
  
      if (error) {
        throw error;
      }
  
      console.log("Document downloaded successfully:", data);
      return data;
    } catch (error) {
      console.error("Error downloading document:", error);
      throw error;
    }
}