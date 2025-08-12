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
  history: ChatMessage[] = []
): Promise<GeminiResponse> {
  try {
    const ai = getGeminiClient();
    
    // Build conversation context from history
    const conversationContext = history.length > 0 
      ? history.slice(-10).map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join('\n') + '\n'
      : '';
    
    const fullPrompt = conversationContext + `User: ${message}\nAssistant:`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
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

export async function* sendMessageToGeminiStream(
  message: string,
  history: ChatMessage[] = []
): AsyncGenerator<string, void, unknown> {
  try {
    const ai = getGeminiClient();
    
    // Build conversation context from history (last 10 messages)
    const conversationContext = history.length > 0 
      ? history.slice(-10).map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join('\n') + '\n'
      : '';
    
    const fullPrompt = conversationContext + `User: ${message}\nAssistant:`;
    
    const stream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 8192,
      },
    });

    for await (const chunk of stream) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error calling Gemini Streaming API:', error);
    throw new Error(`Gemini Streaming API Error: ${error.message || 'Unknown error'}`);
  }
}

export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString();
}