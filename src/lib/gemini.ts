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
  model: string = 'gemini-2.5-flash',
  thinkingBudget: number = 8192
): Promise<GeminiResponse> {
  let attempts = 0;
  const maxRetries = model.includes('2.5-pro') ? 3 : 1; // More retries for Pro model
  
  while (attempts < maxRetries) {
    try {
      attempts++;
      const ai = getGeminiClient();
    
    // Build conversation context
    let fullPrompt = '';
    
    if (systemPrompt) {
      fullPrompt += systemPrompt + '\n\n';
    }
    
    // Add conversation history (reduce for 2.5-Pro to avoid context limit)
    if (history.length > 0) {
      const historyLimit = model.includes('2.5-pro') ? 5 : 10; // Reduce history for Pro model
      const recentHistory = history.slice(-historyLimit);
      console.log('Processing history:', recentHistory.length, 'messages for', model);
      
      for (const msg of recentHistory) {
        // Truncate very long messages to prevent context overflow
        const content = msg.content.length > 1000 ? msg.content.substring(0, 1000) + '...' : msg.content;
        if (msg.role === 'user') {
          fullPrompt += `人間: ${content}\n`;
        } else if (msg.role === 'assistant') {
          fullPrompt += `アシスタント: ${content}\n`;
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
        thinkingConfig: {
          includeThoughts: true,
          ...(thinkingBudget > 0 ? { thinkingBudget } : {}),
        },
      },
    });

    // Extract thoughts and response from parts
    let responseText = '';
    let thoughts = '';
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((response as any).candidates && (response as any).candidates[0]?.content?.parts) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const part of (response as any).candidates[0].content.parts) {
        if (!part.text) continue;
        
        if (part.thought) {
          thoughts += part.text;
        } else {
          responseText += part.text;
        }
      }
    }

      return {
        response: responseText || response.text || 'No response generated',
        reasoning: thoughts || undefined
      };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error(`Gemini API attempt ${attempts}/${maxRetries} failed:`, error);
      
      if (attempts >= maxRetries) {
        console.error('All retry attempts failed');
        console.error('Error details:', {
          message: error.message,
          status: error.status,
          code: error.code,
          stack: error.stack
        });
        
        const errorMessage = error.message || 'Failed to get response from Gemini';
        throw new Error(`Gemini API Error: ${errorMessage}`);
      }
      
      // Wait before retry (exponential backoff)
      const waitTime = Math.pow(2, attempts) * 1000; // 2s, 4s, 8s
      console.log(`Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
}

export async function* sendMessageToGeminiStream(
  message: string,
  history: ChatMessage[] = [],
  systemPrompt: string = '',
  model: string = 'gemini-2.5-flash',
  thinkingBudget: number = 8192
): AsyncGenerator<{text?: string; thinking?: string; done?: boolean}, void, unknown> {
  let attempts = 0;
  const maxRetries = model.includes('2.5-pro') ? 3 : 1; // More retries for Pro model
  
  while (attempts < maxRetries) {
    try {
      attempts++;
      const ai = getGeminiClient();
    
    // Build conversation context
    let fullPrompt = '';
    
    if (systemPrompt) {
      fullPrompt += systemPrompt + '\n\n';
    }
    
    // Add conversation history (reduce for 2.5-Pro to avoid context limit)
    if (history.length > 0) {
      const historyLimit = model.includes('2.5-pro') ? 5 : 10; // Reduce history for Pro model
      const recentHistory = history.slice(-historyLimit);
      console.log('Stream - Processing history:', recentHistory.length, 'messages for', model);
      
      for (const msg of recentHistory) {
        // Truncate very long messages to prevent context overflow
        const content = msg.content.length > 1000 ? msg.content.substring(0, 1000) + '...' : msg.content;
        if (msg.role === 'user') {
          fullPrompt += `人間: ${content}\n`;
        } else if (msg.role === 'assistant') {
          fullPrompt += `アシスタント: ${content}\n`;
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
        thinkingConfig: {
          includeThoughts: true,
          ...(thinkingBudget > 0 ? { thinkingBudget } : {}),
        },
      },
    });

    for await (const chunk of stream) {
      console.log('Received chunk:', chunk);
      
      // Process parts according to official Gemini API
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((chunk as any).candidates && (chunk as any).candidates[0]?.content?.parts) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const part of (chunk as any).candidates[0].content.parts) {
          if (!part.text) continue;
          
          if (part.thought) {
            console.log('Thinking found:', part.text);
            yield { thinking: part.text };
          } else {
            console.log('Response text found:', part.text);
            yield { text: part.text };
          }
        }
      }
      // Fallback for simple text response (backward compatibility)
      else if (chunk.text) {
        yield { text: chunk.text };
      }
      }
      yield { done: true };
      return; // Success, exit retry loop
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error(`Gemini Streaming API attempt ${attempts}/${maxRetries} failed:`, error);
      
      if (attempts >= maxRetries) {
        console.error('All retry attempts failed');
        throw new Error(`Gemini Streaming API Error: ${error.message || 'Unknown error'}`);
      }
      
      // Wait before retry (exponential backoff)
      const waitTime = Math.pow(2, attempts) * 1000; // 2s, 4s, 8s
      console.log(`Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
}

export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString();
}