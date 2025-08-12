import { NextRequest, NextResponse } from 'next/server';
import { sendMessageToGemini, ChatMessage } from '@/lib/gemini';
import { withAuth } from '@/lib/auth';

async function chatHandler(request: NextRequest) {
  try {
    const { message, history } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const result = await sendMessageToGemini(message, history || []);
    
    const responseMessage: ChatMessage = {
      role: 'assistant',
      content: result.response,
      reasoning: result.reasoning,
      timestamp: Date.now()
    };

    return NextResponse.json({ 
      message: responseMessage,
      success: true 
    });
    
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' }, 
      { status: 500 }
    );
  }
}

export const POST = withAuth(chatHandler);