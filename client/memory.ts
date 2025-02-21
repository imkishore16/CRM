


import { ConversationTokenBufferMemory } from "langchain/memory";
import llm from "./llm";


// Initialize memory with a token limit
const memory = new ConversationTokenBufferMemory({
  memoryKey: "chat_history",
  llm: llm,
  maxTokenLimit: 2000, 
});