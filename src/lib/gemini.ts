import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.GOOGLE_AI_API_KEY!;

if (!API_KEY) {
  throw new Error('GOOGLE_AI_API_KEY is not configured');
}

const genAI = new GoogleGenerativeAI(API_KEY);

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
    // Use Gemini 2.5 Pro with thinking enabled
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-thinking-exp-01262025',
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

    // Check if the response contains thinking content
    let reasoning = '';
    let cleanResponse = text;

    // Extract thinking content if present (Gemini thinking models include <thinking> tags)
    const thinkingMatch = text.match(/<thinking>([\s\S]*?)<\/thinking>/);
    if (thinkingMatch) {
      reasoning = thinkingMatch[1].trim();
      cleanResponse = text.replace(/<thinking>[\s\S]*?<\/thinking>/, '').trim();
    }

    return {
      response: cleanResponse,
      reasoning: reasoning || undefined
    };
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw new Error('Failed to get response from Gemini');
  }
}

export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString();
}