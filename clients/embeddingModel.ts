import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not defined in environment variables");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

// Create a wrapper to maintain the same interface
const embeddingModel = {
  async embedQuery(text: string): Promise<number[]> {
    try {
      const result = await model.embedContent(text);
      // Get the values array from the ContentEmbedding response
      const values = result.embedding.values;
      if (!Array.isArray(values)) {
        throw new Error("Invalid embedding format: values is not an array");
      }
      return values;
    } catch (error) {
      console.error("Error generating embedding:", error);
      throw error;
    }
  },

  async embedDocuments(texts: string[]): Promise<number[][]> {
    try {
      const embeddings = await Promise.all(
        texts.map(async (text) => this.embedQuery(text))
      );
      return embeddings;
    } catch (error) {
      console.error("Error generating embedding:", error);
      throw error;
    }
  }
};

export default embeddingModel;
