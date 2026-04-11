'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function ChatContent() {
  const [messages, setMessages] = useState<Array<{id: string; content: string; isUser: boolean; sources?: Array<any>}>>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [modelSelector, setModelSelector] = useState<'general' | 'document'>('document');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [docId, setDocId] = useState<string | null>(null);
  const searchParams = useSearchParams();

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
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Neural Engine failed to respond.');
      }
      
      const data = await response.json();
      
      const botMessage = {
        id: Math.random().toString(36).substr(2, 9),
        content: data.answer,
        isUser: false,
        sources: data.sources || []
      };
      
      setMessages(prev => [...prev, botMessage]);
      } catch (error: unknown) {
        console.error('Chat error:', error);
        const errorMessage = {
          id: Math.random().toString(36).substr(2, 9),
          content: error instanceof Error ? error.message : 'Sorry, I encountered an error. Please try again.',
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
           <span className="text-textMuted text-xs font-bold uppercase tracking-widest">AI Context Profile:</span>
           <div className="flex p-1 bg-white/5 rounded-full border border-white/10">
             <button 
               onClick={() => setModelSelector('general')}
               className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-tighter transition-all ${
                 modelSelector === 'general' 
                   ? 'bg-primary text-white shadow-lg' 
                   : 'text-textMuted hover:text-white'
               }`}
             >
               General AI Brain
             </button>
             <button 
               onClick={() => setModelSelector('document')}
               className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-tighter transition-all ${
                 modelSelector === 'document' 
                   ? 'bg-primary text-white shadow-lg' 
                   : 'text-textMuted hover:text-white'
               }`}
             >
               Document Brain
             </button>
           </div>
         </div>
       </header>

      <div className="flex-1 glass-card p-0 flex flex-col relative overflow-hidden bg-black/20 border-white/5">
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-20">
               <span className="text-6xl mb-6">🤖</span>
               <h3 className="text-xl font-bold text-white mb-2">VisionMind Neural Chat</h3>
               <p className="text-sm max-w-xs">Ask me anything about your documents or start a general conversation.</p>
            </div>
          )}
          {messages.map((message, index) => (
            <div key={index} className={`flex flex-col ${
              message.isUser ? 'items-end' : 'items-start'
            }`}>
              <div className={`flex items-start gap-3 max-w-[85%] ${
                message.isUser ? 'flex-row-reverse' : 'flex-row'
               }`}>
                 <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                   message.isUser ? 'bg-white/10 text-white' : 'bg-primary/20 text-primary'
                 }`}>
                   {message.isUser ? 'YOU' : 'AI'}
                 </div>
                 <div className={`flex flex-col gap-2 ${message.isUser ? 'items-end' : 'items-start'}`}>
                    <div className={`rounded-3xl px-6 py-4 text-sm leading-relaxed ${
                      message.isUser 
                        ? 'bg-primary text-white rounded-tr-none' 
                        : 'bg-white/5 text-white border border-white/10 rounded-tl-none'
                    }`}>
                      {message.content}
                    </div>
                    { !message.isUser && message.sources && message.sources.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {message.sources.map((source, sourceIndex) => (
                          <div key={sourceIndex} className="flex items-center gap-1.5 px-2 py-1 bg-white/5 border border-white/5 rounded-lg text-[10px] text-textMuted">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/40"></span>
                            <span>Ref #{source.doc_id?.substring(0, 6) || 'source'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                 </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-primary/20 text-primary animate-pulse font-bold text-xs">AI</div>
              <div className="bg-white/5 border border-white/10 rounded-3xl rounded-tl-none px-6 py-4 flex items-center gap-2">
                 <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce"></div>
                 <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                 <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-black/40 border-t border-white/5">
           <form onSubmit={sendMessage} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-2 focus-within:border-primary/50 transition-all">
             <input
               type="text"
               value={input}
               onChange={(e) => setInput(e.target.value)}
               placeholder={modelSelector === 'document' ? "Ask about your documents..." : "Ask me anything..."}
               className="flex-1 bg-transparent border-none focus:ring-0 text-white text-sm px-4 py-2"
               disabled={loading}
             />
             <button
               type="submit"
               disabled={loading || !input.trim()}
               className="p-3 bg-primary text-white rounded-xl hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] disabled:opacity-30 disabled:hover:shadow-none transition-all"
             >
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
               </svg>
             </button>
           </form>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
       <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
       </div>
    }>
       <ChatContent />
    </Suspense>
  );
}