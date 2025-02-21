import { OpenAI } from "@langchain/openai";

const model_id = "google/flan-t5-small"
// const model_id = "meta-llama/Llama-3.2-1B-Instruct"
import { HuggingFaceInference } from "@langchain/community/llms/hf";

const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;

// Initialize Hugging Face LLM
const llm = new HuggingFaceInference({
  apiKey: HF_API_KEY,
  model: model_id,
  temperature: 0.7,
});

export default llm