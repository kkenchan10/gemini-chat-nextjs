import { ChatMessage } from '@/lib/gemini';
import { User, Bot, Clock, Brain } from 'lucide-react';
import { useState } from 'react';
import MarkdownRenderer from './MarkdownRenderer';

interface MessageBubbleProps {
  message: ChatMessage;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const [showReasoning, setShowReasoning] = useState(false);
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 ${isUser ? 'ml-3' : 'mr-3'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isUser ? 'bg-blue-500' : 'bg-green-500'
          }`}>
            {isUser ? (
              <User size={16} className="text-white" />
            ) : (
              <Bot size={16} className="text-white" />
            )}
          </div>
        </div>
        
        {/* Message Content */}
        <div className="flex-1 space-y-2">
          {/* Main Message */}
          <div
            className={`px-4 py-2 rounded-lg ${
              isUser
                ? 'bg-blue-500 text-white rounded-br-sm'
                : 'bg-white text-gray-900 rounded-bl-sm border shadow-sm'
            }`}
          >
            {isUser ? (
              <div className="text-white whitespace-pre-wrap">
                {message.content}
              </div>
            ) : (
              <MarkdownRenderer content={message.content} />
            )}
          </div>
          
          {/* Reasoning Section for AI messages */}
          {!isUser && message.reasoning && (
            <div className="space-y-1">
              <button
                onClick={() => setShowReasoning(!showReasoning)}
                className="flex items-center text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                <Brain size={12} className="mr-1" />
                {showReasoning ? 'Hide' : 'Show'} reasoning
              </button>
              
              {showReasoning && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
                  <div className="font-medium text-yellow-800 mb-2 flex items-center">
                    <Brain size={14} className="mr-1" />
                    AI Reasoning Process:
                  </div>
                  <div className="text-yellow-700 whitespace-pre-wrap font-mono text-xs">
                    {message.reasoning}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Timestamp */}
          <div className={`flex items-center text-xs text-gray-400 ${
            isUser ? 'justify-end' : 'justify-start'
          }`}>
            <Clock size={10} className="mr-1" />
            {new Date(message.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
}