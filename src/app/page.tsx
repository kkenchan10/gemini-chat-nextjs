'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChatMessage } from '@/lib/gemini';
import MessageBubble from '@/components/MessageBubble';
import ChatInput from '@/components/ChatInput';
import { LogOut, Trash2, MessageSquare, Plus } from 'lucide-react';

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async (content: string) => {
    const userMessage: ChatMessage = {
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    // Create placeholder for streaming response
    const assistantMessageId = Date.now();
    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: '',
      timestamp: assistantMessageId,
    };
    
    setMessages(prev => [...prev, assistantMessage]);

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          history: messages,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let streamContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.error) {
                  throw new Error(data.error);
                }
                
                if (data.content) {
                  streamContent += data.content;
                  
                  // Update the assistant message with streaming content
                  setMessages(prev => 
                    prev.map(msg => 
                      msg.timestamp === assistantMessageId
                        ? { ...msg, content: streamContent }
                        : msg
                    )
                  );
                }
                
                if (data.done) {
                  break;
                }
              } catch (parseError) {
                console.error('Error parsing stream data:', parseError);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev.slice(0, -1), errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const newChat = () => {
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MessageSquare className="text-blue-500" size={24} />
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Gemini Chat App
              </h1>
              <p className="text-sm text-gray-500">
                Powered by Gemini 2.5 Flash with streaming
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={newChat}
              className="px-3 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center space-x-1"
              title="New chat"
            >
              <Plus size={18} />
              <span className="text-sm font-medium">New Chat</span>
            </button>
            <button
              onClick={clearChat}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Clear current chat"
            >
              <Trash2 size={18} />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-20">
            <MessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">Welcome to Gemini Chat</h3>
            <p className="text-sm">
              Start a conversation with Gemini 2.5 Flash AI assistant.<br />
              Messages stream in real-time! Ask anything you'd like to know.
            </p>
            <div className="mt-6 text-xs text-gray-400 space-y-1">
              <p>⚡ Real-time streaming responses</p>
              <p>💬 Remembers up to 10 previous messages</p>
              <p>✨ Supports Markdown formatting</p>
              <p>🔢 LaTeX math equations</p>
              <p>📊 Mermaid diagrams</p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <MessageBubble key={index} message={message} />
          ))
        )}
        
        {loading && (
          <div className="flex justify-start mb-4">
            <div className="flex">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center mr-3">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
              <div className="bg-gray-100 px-4 py-2 rounded-lg rounded-bl-sm border">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput
        onSendMessage={handleSendMessage}
        disabled={loading}
        loading={loading}
      />
    </div>
  );
}
