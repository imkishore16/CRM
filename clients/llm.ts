// import { OpenAI } from "@langchain/openai";
// import { HuggingFaceInference } from "@langchain/community/llms/hf";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HarmBlockThreshold, HarmCategory } from "@google/generative-ai"

// const model_id = "google/flan-t5-small"
// const model_id = "meta-llama/Llama-3.2-1B-Instruct"



// const llm = new HuggingFaceInference({
//   apiKey: process.env.HUGGINGFACE_API_KEY,
//   model: model_id,
//   temperature: 0.7,
// });
// export default llm



const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY??"");
const model = genAI.getGenerativeModel({ model: "gemini-pro" });
const llm = new ChatGoogleGenerativeAI({
    // modelName: "gemini-pro",
    modelName: "gemini-2.0-flash",
    apiKey: process.env.GEMINI_API_KEY,
    maxOutputTokens: 8192,
    temperature:0.6,
    // ??
    // topP: 0.95,
    // topK: 40,
    safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
        },
      ],
});

export default llm