'use client';

import { useState, useRef, useEffect, useSearchParams } from 'react';

export default function ChatPage() {
  const [messages, setMessages] = useState<Array<{id: string; content: string; isUser: boolean; sources?: Array<any>}>>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [modelSelector, setModelSelector] = useState<'general' | 'document'>('document');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [docId, setDocId] = useState<string | null>(null);
  const [searchParams] = useSearchParams();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle docId from URL parameters
  useEffect(() => {
    const urlDocId = searchParams.get('docId');
    if (urlDocId) {
      setDocId(urlDocId);
    }
  }, [searchParams]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || loading) return;
    
    const userMessage = {
      id: Math.random().toString(36).substr(2, 9),
      content: input,
      isUser: true
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query: input,
          model: modelSelector === 'general' ? 'general' : 'document',
          docId: docId
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response from AI');
      }
      
      const data = await response.json();
      
      const botMessage = {
        id: Math.random().toString(36).substr(2, 9),
        content: data.answer,
        isUser: false,
        sources: data.sources || []
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        id: Math.random().toString(36).substr(2, 9),
        content: 'Sorry, I encountered an error. Please try again.',
        isUser: false
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen p-6 lg:p-12 animate-fade-in">
       <header className="mb-8">
         <h1 className="text-3xl md:text-4xl font-bold mb-2">💬 Document Chat</h1>
         <p className="text-textMuted text-lg">
           Ask questions across all your processed documents using AI-powered retrieval
         </p>
         <div className="flex items-center space-x-4 mt-4">
           <span className="text-textMuted">AI Model:</span>
           <div className="flex space-x-2">
             <button 
               onClick={() => setModelSelector('general')}
               className={`px-3 py-1 rounded-full text-xs font-medium ${
                 modelSelector === 'general' 
                   ? 'bg-primary text-white' 
                   : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
               }`}
             >
               General Assistant
             </button>
             <button 
               onClick={() => setModelSelector('document')}
               className={`px-3 py-1 rounded-full text-xs font-medium ${
                 modelSelector === 'document' 
                   ? 'bg-primary text-white' 
                   : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
               }`}
             >
               Document Intelligence
             </button>
           </div>
         </div>
       </header>

      <div className="flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div key={index} className={`flex flex-col ${
              message.isUser ? 'ml-auto mr-0' : 'mr-auto ml-0'
            } max-w-[80%]`}>
              <div className={`flex items-start ${
                message.isUser ? 'justify-end' : 'justify-start'
              } mb-1`}>
                { !message.isUser && (
                  <div className="flex items-center space-x-2 text-textMuted text-xs">
                    <span>🤖 VisionMind AI</span>
                    {message.sources && message.sources.length > 0 && (
                      <span className="bg-primary/20 text-primary px-2 py-0.5 rounded text-xs">
                        Sources: {message.sources.length}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className={`flex items-start gap-2 ${
                message.isUser ? 'justify-end' : 'justify-start'
              }`}>
                { !message.isUser && (
                  <div className="w-6 h-6 flex items-center justify-center bg-primary/20 text-primary rounded-full">
                    🤖
                  </div>
                )}
                <div className={`flex flex-col gap-1 ${
                  message.isUser ? 'items-end' : 'items-start'
                }`}>
                  <div className={`rounded-xl px-4 py-3 max-w-xs ${
                    message.isUser 
                      ? 'bg-primary text-white' 
                      : 'bg-white/5 text-white border border-white/10'
                  }`}>
                    {message.content}
                  </div>
                  { !message.isUser && message.sources && message.sources.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2 text-xs">
                      {message.sources.map((source, sourceIndex) => (
                        <div key={sourceIndex} className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-primary"></span>
                          <span className="text-textMuted/70">
                            Doc #{source.document_id?.substring(0, 8) ?? 'unknown'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-start space-x-2">
              <div className="w-6 h-6 flex items-center justify-center bg-primary/20 text-primary rounded-full">
                🤖
              </div>
              <div className="flex flex-col gap-1 items-start">
                <div className="rounded-xl px-4 py-3 max-w-xs bg-white/5 text-white border border-white/10 animate-pulse">
                  Thinking...
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="pt-4" ref={messagesEndRef}></div>
      </div>

      <form onSubmit={sendMessage} className="flex items-center gap-2 p-4 border-t border-white/5">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about your documents..."
          className="flex-1 rounded-xl px-4 py-3 bg-white/5 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-primary"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-6 py-3 rounded-full bg-primary/20 text-primary border border-primary/30 hover:bg-primary hover:text-white hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all duration-300 font-medium disabled:opacity-50"
        >
          {loading ? 'Thinking...' : 'Ask'}
        </button>
      </form>
    </div>
  );
}