import { GoogleGenAI } from '@google/genai';

function getGeminiClient() {
  const API_KEY = process.env.GOOGLE_AI_API_KEY;
  
  if (!API_KEY) {
    throw new Error('GOOGLE_AI_API_KEY is not configured');
  }
  
  return new GoogleGenAI({
    apiKey: API_KEY,
  });
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  reasoning?: string;
  timestamp: number;
}

export interface GeminiResponse {
  response: string;
  reasoning?: string;
}

export async function sendMessageToGemini(
  message: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  history: ChatMessage[] = []
): Promise<GeminiResponse> {
  try {
    const ai = getGeminiClient();
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: message,
      config: {
        temperature: 0.7,
        maxOutputTokens: 8192,
      },
    });

    return {
      response: response.text || 'No response generated',
      reasoning: undefined
    };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error calling Gemini API:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.status,
      code: error.code,
      stack: error.stack
    });
    
    const errorMessage = error.message || 'Failed to get response from Gemini';
    throw new Error(`Gemini API Error: ${errorMessage}`);
  }
}

export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString();
}