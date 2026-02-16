
import { GoogleGenAI, GenerateContentResponse, Chat } from "@google/genai";
import { BRAINSTORMFLOW_SYSTEM_PROMPT } from "../constants";
import { Message } from "../types";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API_KEY environment variable is not set.");
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateResponse(history: Message[]): Promise<{ text: string; groundingLinks: any[] }> {
    const model = 'gemini-3-flash-preview';
    
    // Convert history to Gemini format
    const contents = history.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    try {
      const response: GenerateContentResponse = await this.ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction: BRAINSTORMFLOW_SYSTEM_PROMPT,
          tools: [{ googleSearch: {} }],
        },
      });

      const text = response.text || "I'm sorry, I couldn't generate a response.";
      const groundingLinks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

      return { text, groundingLinks };
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();
