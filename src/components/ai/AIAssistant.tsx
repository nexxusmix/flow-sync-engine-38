import { useState, useRef, useEffect } from "react";

interface Message {
  role: 'user' | 'ai';
  content: string;
}

interface AIAssistantProps {
  onClose: () => void;
}

export function AIAssistant({ onClose }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: "Olá! Sou o Polo AI, seu assistente da SQUAD Hub. Como posso ajudar você hoje?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setLoading(true);

    // TODO: Integrar com Lovable AI quando configurado
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: "O assistente IA está em desenvolvimento. Esta funcionalidade estará disponível em breve com inteligência artificial real para ajudá-lo a gerenciar seus projetos, análises e muito mais." 
      }]);
      setLoading(false);
    }, 500);
  };

  return (
    <div className="fixed bottom-32 right-8 z-50 w-full max-w-[360px] sm:max-w-[400px] glass-card rounded-[2rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.9)] overflow-hidden border border-border flex flex-col h-[500px]">
      {/* Header */}
      <div className="p-5 bg-card border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary">auto_awesome</span>
          </div>
          <div>
            <span className="font-black text-[10px] uppercase tracking-widest text-foreground">Polo AI</span>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Assistente SQUAD</p>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="w-8 h-8 rounded-xl hover:bg-muted flex items-center justify-center transition-colors"
        >
          <span className="material-symbols-outlined text-muted-foreground hover:text-foreground">close</span>
        </button>
      </div>
      
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm ${
              msg.role === 'user' 
                ? 'bg-foreground text-background font-medium' 
                : 'bg-muted border border-border text-muted-foreground'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-muted border border-border px-4 py-3 rounded-2xl">
              <span className="flex gap-1.5">
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border bg-card/80">
        <div className="flex gap-3">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Pergunte ao Polo AI..."
            className="flex-1 bg-muted border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 placeholder:text-muted-foreground transition-colors"
          />
          <button 
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="w-12 h-12 bg-primary text-primary-foreground rounded-xl flex items-center justify-center disabled:opacity-50 hover:scale-105 active:scale-95 transition-all shadow-[0_10px_30px_-10px_hsl(var(--primary)/0.5)]"
          >
            <span className="material-symbols-outlined">send</span>
          </button>
        </div>
      </div>
    </div>
  );
}
