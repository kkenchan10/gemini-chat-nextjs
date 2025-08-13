'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChatMessage } from '@/lib/gemini';
import MessageBubble from '@/components/MessageBubble';
import ChatInput from '@/components/ChatInput';
import SystemPromptModal from '@/components/SystemPromptModal';
import { LogOut, Trash2, MessageSquare, Plus, Settings, TestTube, Brain } from 'lucide-react';

const DEFAULT_SYSTEM_PROMPT = `# 大学受験パートナーAI - システムプロンプト（共通テスト全教科＋岩手大学理系二次対応・数式強化）

## 🎯 あなたの役割
日本の大学受験を目指す高校3年生の  
**最強の学習パートナー**です。  

- 対応科目：  
  **数学I・A / II・B / III**  
  **物理・化学・生物・地学**  
  **国語（現代文・古文・漢文）**  
  **英語（リーディング・リスニング）**  
  **社会（日本史・世界史・地理・公民）**  
- 対応試験：**共通テスト全教科**、**国立岩手大学理系二次試験**  
- 目的：ただ答えを教えるのではなく、**本質理解**と**応用力**を育てる

## 💬 コミュニケーションスタイル
- 丁寧で親しみやすい語り口調
- 生徒のレベルに合わせた説明
- 質問を促し、理解度を確認
- ポジティブに励まし、学習意欲を向上
- 段階的に展開

## 🎯 最終目標
生徒が**自分で考え、解ける力**を持ち  
**共通テスト全教科**と**岩手大学二次試験**の両方で  
**最大得点**を狙える実力を養成すること`;

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState<string>(DEFAULT_SYSTEM_PROMPT);
  const [isSystemPromptModalOpen, setIsSystemPromptModalOpen] = useState(false);
  const [thinkingTrace, setThinkingTrace] = useState<string>('');
  const [showThinking, setShowThinking] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.5-flash');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Auto-scroll only when new messages are added, not during streaming updates
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 100);
    return () => clearTimeout(timer);
  }, [messages.length]);

  const handleSendMessage = async (content: string) => {
    const userMessage: ChatMessage = {
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    console.log('Sending message with history:', messages.length, 'previous messages');

    // Create placeholder for streaming response
    const assistantMessageId = Date.now() + Math.random();
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
          history: messages.slice(-10).filter(msg => msg.content && msg.content.trim().length > 0), // Filter empty messages
          systemPrompt: systemPrompt,
          model: selectedModel,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`Failed to send message: ${response.status} ${errorText}`);
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
                
                if (data.thinking) {
                  setThinkingTrace(data.thinking);
                }
                
                if (data.content) {
                  streamContent += data.content;
                  
                  // Update the assistant message with streaming content
                  setMessages(prev => {
                    const newMessages = [...prev];
                    // Find the specific assistant message by timestamp, not just the last message
                    const messageIndex = newMessages.findIndex(msg => 
                      msg.timestamp === assistantMessageId && msg.role === 'assistant'
                    );
                    if (messageIndex !== -1) {
                      newMessages[messageIndex] = {
                        ...newMessages[messageIndex],
                        content: streamContent,
                        reasoning: thinkingTrace || newMessages[messageIndex].reasoning
                      };
                    }
                    return newMessages;
                  });
                  
                  // Smooth auto-scroll during streaming
                  if (streamContent.length % 100 === 0) { // Scroll every 100 characters for smoother experience
                    requestAnimationFrame(() => {
                      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
                    });
                  }
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
      
      // Final scroll to bottom after streaming completes
      requestAnimationFrame(() => {
        scrollToBottom();
      });
      
      // Clear thinking trace
      setThinkingTrace('');
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
    setThinkingTrace('');
  };

  const testStreaming = async () => {
    const testMessage = "簡単な数学の問題を出してください。解き方も含めて説明してください。";
    await handleSendMessage(testMessage);
  };

  const handleSystemPromptSave = (newPrompt: string) => {
    setSystemPrompt(newPrompt);
    localStorage.setItem('systemPrompt', newPrompt);
  };

  // Load system prompt from localStorage on mount
  useEffect(() => {
    const savedPrompt = localStorage.getItem('systemPrompt');
    if (savedPrompt) {
      setSystemPrompt(savedPrompt);
    }
  }, []);

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
                Powered by {selectedModel.replace('gemini-', 'Gemini ').replace('-', '.')} with streaming
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="gemini-2.5-flash">Gemini 2.5-Flash</option>
              <option value="gemini-2.5-pro">Gemini 2.5-Pro</option>
              <option value="gemini-1.5-flash">Gemini 1.5-Flash</option>
              <option value="gemini-1.5-pro">Gemini 1.5-Pro</option>
            </select>
            <button
              onClick={newChat}
              className="px-3 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center space-x-1"
              title="New chat"
            >
              <Plus size={18} />
              <span className="text-sm font-medium">New Chat</span>
            </button>
            <button
              onClick={testStreaming}
              className="px-3 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors flex items-center space-x-1"
              title="Test streaming"
              disabled={loading}
            >
              <TestTube size={16} />
              <span className="text-sm font-medium">テスト</span>
            </button>
            <button
              onClick={() => setShowThinking(!showThinking)}
              className={`p-2 transition-colors rounded-lg ${
                showThinking 
                  ? 'text-purple-600 bg-purple-50 hover:bg-purple-100' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              title="Toggle thinking display"
            >
              <Brain size={18} />
            </button>
            <button
              onClick={() => setIsSystemPromptModalOpen(true)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="System prompt settings"
            >
              <Settings size={18} />
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

      {/* Thinking Display */}
      {showThinking && thinkingTrace && (
        <div className="bg-purple-50 border-b border-purple-200 p-3">
          <div className="flex items-center space-x-2 mb-2">
            <Brain size={16} className="text-purple-600" />
            <span className="text-sm font-medium text-purple-800">推論中...</span>
          </div>
          <div className="text-xs text-purple-700 bg-white rounded p-2 max-h-20 overflow-y-auto font-mono">
            {thinkingTrace}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-20">
            <MessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">Welcome to Gemini Chat</h3>
            <p className="text-sm">
              Start a conversation with Gemini 2.5 Flash AI assistant.<br />
              Messages stream in real-time! Ask anything you&apos;d like to know.
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

      {/* System Prompt Modal */}
      <SystemPromptModal
        isOpen={isSystemPromptModalOpen}
        onClose={() => setIsSystemPromptModalOpen(false)}
        systemPrompt={systemPrompt}
        onSave={handleSystemPromptSave}
      />
    </div>
  );
}
