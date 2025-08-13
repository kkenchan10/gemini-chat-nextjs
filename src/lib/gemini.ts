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
  history: ChatMessage[] = [],
  systemPrompt: string = '',
  model: string = 'gemini-2.5-flash'
): Promise<GeminiResponse> {
  try {
    const ai = getGeminiClient();
    
    // Build conversation context
    let fullPrompt = '';
    
    if (systemPrompt) {
      fullPrompt += systemPrompt + '\n\n';
    }
    
    // Add conversation history (last 10 messages)
    if (history.length > 0) {
      const recentHistory = history.slice(-10);
      console.log('Processing history:', recentHistory.length, 'messages');
      for (const msg of recentHistory) {
        if (msg.role === 'user') {
          fullPrompt += `人間: ${msg.content}\n`;
        } else if (msg.role === 'assistant') {
          fullPrompt += `アシスタント: ${msg.content}\n`;
        }
      }
    }
    
    fullPrompt += `人間: ${message}\nアシスタント: `;
    console.log('Full prompt length:', fullPrompt.length);
    
    const response = await ai.models.generateContent({
      model: model,
      contents: fullPrompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 8192,
      },
    });

    return {
      response: response.text || 'No response generated',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      reasoning: (response as any).thinkingTrace || undefined
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
  history: ChatMessage[] = [],
  systemPrompt: string = '',
  model: string = 'gemini-2.5-flash'
): AsyncGenerator<{text?: string; thinking?: string; done?: boolean}, void, unknown> {
  try {
    const ai = getGeminiClient();
    
    // Build conversation context
    let fullPrompt = '';
    
    if (systemPrompt) {
      fullPrompt += systemPrompt + '\n\n';
    }
    
    // Add conversation history (last 10 messages)
    if (history.length > 0) {
      const recentHistory = history.slice(-10);
      console.log('Stream - Processing history:', recentHistory.length, 'messages');
      for (const msg of recentHistory) {
        if (msg.role === 'user') {
          fullPrompt += `人間: ${msg.content}\n`;
        } else if (msg.role === 'assistant') {
          fullPrompt += `アシスタント: ${msg.content}\n`;
        }
      }
    }
    
    fullPrompt += `人間: ${message}\nアシスタント: `;
    console.log('Stream - Full prompt length:', fullPrompt.length);
    
    const stream = await ai.models.generateContentStream({
      model: model,
      contents: fullPrompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 8192,
      },
    });

    for await (const chunk of stream) {
      console.log('Received chunk:', chunk);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((chunk as any).thinkingTrace) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        console.log('Thinking trace found:', (chunk as any).thinkingTrace);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        yield { thinking: (chunk as any).thinkingTrace };
      }
      if (chunk.text) {
        yield { text: chunk.text };
      }
    }
    yield { done: true };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error calling Gemini Streaming API:', error);
    throw new Error(`Gemini Streaming API Error: ${error.message || 'Unknown error'}`);
  }
}

export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString();
}