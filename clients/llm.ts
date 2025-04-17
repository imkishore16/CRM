import { ChatOpenAI } from "@langchain/openai";
import { HuggingFaceInference } from "@langchain/community/llms/hf";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HarmBlockThreshold, HarmCategory } from "@google/generative-ai";

export function getLLM(provider: string) {
  switch (provider) {
    case "openai":
      return new ChatOpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        temperature: 0.7,
        modelName: "gpt-3.5-turbo",
      });

    case "huggingface":
      return new HuggingFaceInference({
        apiKey: process.env.HUGGINGFACE_API_KEY,
        model: "google/flan-t5-small",
        temperature: 0.7,
      });

    case "gemini":
      return new ChatGoogleGenerativeAI({
        modelName: "gemini-2.0-flash",
        apiKey: process.env.GEMINI_API_KEY,
        temperature: 0.6,
        maxOutputTokens: 8192,
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
          },
        ],
      });

    default:
      throw new Error("Unsupported LLM provider");
  }
}
