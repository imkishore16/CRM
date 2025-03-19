
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
    

const HF_API_KEY = process.env.HUGGINGFACE_API_KEY; 
const embeddingModel = new HuggingFaceInferenceEmbeddings({
    apiKey: HF_API_KEY,
    model: "sentence-transformers/all-MiniLM-L6-v2", // Replace with your desired embedding model
});



// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-005"});

export default embeddingModel;
