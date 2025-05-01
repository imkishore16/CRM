// src/clients/llm.ts
import { ChatOpenAI } from "@langchain/openai";
import { HuggingFaceInference } from "@langchain/community/llms/hf";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import { 
  SystemMessage, 
  HumanMessage, 
  AIMessage 
} from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { 
  ChatPromptTemplate, 
  PromptTemplate 
} from "@langchain/core/prompts";
import { Document } from "@langchain/core/documents";
import { OpenAIEmbeddings } from "@langchain/openai";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";

// Define message types for our unified interface
type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

/**
 * Unified LLM interface that abstracts away provider differences
 */
class UnifiedLLM {
  private provider: string;
  private model: any;
  private embeddingModel: any;

  constructor(provider: string) {
    this.provider = provider;
    this.model = this.initializeLLM(provider);
    this.embeddingModel = this.initializeEmbeddings(provider);
  }

  /**
   * Initialize the underlying LLM based on provider
   */
  private initializeLLM(provider: string) {
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
        throw new Error(`Unsupported LLM provider: ${provider}`);
    }
  }

  /**
   * Initialize embeddings model based on provider
   */
  private initializeEmbeddings(provider: string) {
    switch (provider) {
      case "openai":
        return new OpenAIEmbeddings({
          apiKey: process.env.OPENAI_API_KEY,
          modelName: "text-embedding-3-small",
        });

      case "huggingface":
        return new HuggingFaceInferenceEmbeddings({
          apiKey: process.env.HUGGINGFACE_API_KEY,
          model: "sentence-transformers/all-MiniLM-L6-v2",
        });

      case "gemini":
        return new GoogleGenerativeAIEmbeddings({
          apiKey: process.env.GEMINI_API_KEY,
          modelName: "embedding-001",
        });

      default:
        throw new Error(`Unsupported embedding provider: ${provider}`);
    }
  }

  /**
   * Convert standard message format to LangChain message format
   */
  private convertToLangChainMessages(messages: Message[]) {
    return messages.map(msg => {
      if (msg.role === "system") {
        return new SystemMessage(msg.content);
      } else if (msg.role === "user") {
        return new HumanMessage(msg.content);
      } else {
        return new AIMessage(msg.content);
      }
    });
  }

  /**
   * Generate chat completion
   */
  async generateText(messages: Message[]): Promise<string> {
    try {
      const langChainMessages = this.convertToLangChainMessages(messages);
      
      const response = await this.model.invoke(langChainMessages);
      
      // Extract content from the response based on model type
      let content: string;
      if (typeof response === 'string') {
        content = response;
      } else if (response.content) {
        content = response.content.toString();
      } else {
        content = JSON.stringify(response);
      }
      
      return content;
    } catch (error) {
      console.error(`Error generating text with ${this.provider}:`, error);
      throw error;
    }
  }

  /**
   * Create embeddings for a text
   */
  async embedText(text: string): Promise<number[]> {
    try {
      const result = await this.embeddingModel.embedQuery(text);
      return result;
    } catch (error) {
      console.error(`Error creating embeddings with ${this.provider}:`, error);
      throw error;
    }
  }

  /**
   * Create embeddings for multiple documents
   */
  async embedDocuments(documents: string[]): Promise<number[][]> {
    try {
      const result = await this.embeddingModel.embedDocuments(documents);
      return result;
    } catch (error) {
      console.error(`Error creating document embeddings with ${this.provider}:`, error);
      throw error;
    }
  }

  /**
   * Process with a prompt template
   */
  async processWithTemplate(templateString: string, variables: Record<string, any>): Promise<string> {
    try {
      const prompt = ChatPromptTemplate.fromTemplate(templateString);
      const chain = prompt.pipe(this.model).pipe(new StringOutputParser());
      const result = await chain.invoke(variables);
      return result;
    } catch (error) {
      console.error(`Error processing template with ${this.provider}:`, error);
      throw error;
    }
  }

  /**
   * Summarize text
   */
  async summarize(text: string, maxLength: number = 100): Promise<string> {
    try {
      const messages = [
        {
          role: "system" as const,
          content: `Summarize the following text in no more than ${maxLength} words.`
        },
        {
          role: "user" as const,
          content: text
        }
      ];
      
      return await this.generateText(messages);
    } catch (error) {
      console.error(`Error summarizing text with ${this.provider}:`, error);
      throw error;
    }
  }

  /**
   * Get the raw LLM model instance
   * Useful for direct access when needed
   */
  getRawModel() {
    return this.model;
  }

  /**
   * Get the raw embeddings model instance
   */
  getRawEmbeddingsModel() {
    return this.embeddingModel;
  }
}

/**
 * Factory function to get an LLM instance
 */
export function getLLM(provider: string): UnifiedLLM {
  return new UnifiedLLM(provider);
}