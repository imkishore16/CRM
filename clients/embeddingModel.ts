
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf"; // For Hugging Face embeddings


const HF_API_KEY = process.env.HUGGINGFACE_API_KEY; 
const embeddingModel = new HuggingFaceInferenceEmbeddings({
    apiKey: HF_API_KEY,
    model: "sentence-transformers/all-MiniLM-L6-v2", // Replace with your desired embedding model
  });

export default embeddingModel;