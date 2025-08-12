import { GoogleGenerativeAI } from '@google/generative-ai';

function getGeminiClient() {
  const API_KEY = process.env.GOOGLE_AI_API_KEY;
  
  if (!API_KEY) {
    throw new Error('GOOGLE_AI_API_KEY is not configured');
  }
  
  return new GoogleGenerativeAI(API_KEY);
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
  history: ChatMessage[] = []
): Promise<GeminiResponse> {
  try {
    const genAI = getGeminiClient();
    
    // Use Gemini Pro model
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-pro',
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 8192,
      },
    });

    // Build conversation history
    const conversationHistory = history
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    const fullPrompt = conversationHistory 
      ? `${conversationHistory}\nuser: ${message}`
      : `user: ${message}`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    return {
      response: text,
      reasoning: undefined  // gemini-pro doesn't have reasoning mode
    };
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw new Error('Failed to get response from Gemini');
  }
}

export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString();
}