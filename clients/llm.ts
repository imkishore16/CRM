// import { OpenAI } from "@langchain/openai";
// import { HuggingFaceInference } from "@langchain/community/llms/hf";
import { GoogleGenerativeAI } from "@google/generative-ai";


// const model_id = "google/flan-t5-small"
// const model_id = "meta-llama/Llama-3.2-1B-Instruct"



// const llm = new HuggingFaceInference({
//   apiKey: process.env.HUGGINGFACE_API_KEY,
//   model: model_id,
//   temperature: 0.7,
// });
// export default llm



const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY??"");
const llm = genAI.getGenerativeModel({ model: "gemini-pro" }); 

export default llm