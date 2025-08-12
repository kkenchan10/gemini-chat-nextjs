import { NextRequest, NextResponse } from 'next/server';
import { sendMessageToGeminiStream } from '@/lib/gemini';

async function streamHandler(request: NextRequest) {
  try {
    const { message, history, systemPrompt } = await request.json();

    if (!message || typeof message !== 'string') {
      return Response.json({ error: 'Message is required' }, { status: 400 });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of sendMessageToGeminiStream(message, history || [], systemPrompt || '')) {
            const data = JSON.stringify({ content: chunk, done: false });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }
          
          // Send completion signal
          const completeData = JSON.stringify({ content: '', done: true });
          controller.enqueue(encoder.encode(`data: ${completeData}\n\n`));
          
          controller.close();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
          console.error('Streaming error:', error);
          const errorData = JSON.stringify({ error: error.message, done: true });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
    
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Stream API error:', error);
    return Response.json(
      { error: error.message || 'Failed to process streaming request' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Simple auth check for streaming endpoint
  const authCookie = request.cookies.get('gemini-chat-auth');
  
  if (!authCookie || authCookie.value !== 'authenticated') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  return streamHandler(request);
}