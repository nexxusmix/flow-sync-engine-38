import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIAssistantProps {
  onClose: () => void;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/polo-ai-chat`;

export function AIAssistant({ onClose }: AIAssistantProps) {
  const location = useLocation();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "**Polo AI ativo.** Sou seu agente executor autônomo. Diga o que precisa e eu executo." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const streamChat = async (userMessages: Message[]) => {
    const context = {
      currentRoute: location.pathname,
      timestamp: new Date().toISOString(),
    };

    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ 
        messages: userMessages.map(m => ({ role: m.role, content: m.content })),
        context 
      }),
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      if (resp.status === 429) {
        toast.error("Limite de requisições excedido. Aguarde alguns segundos.");
        throw new Error("Rate limited");
      }
      if (resp.status === 402) {
        toast.error("Créditos de IA insuficientes.");
        throw new Error("Payment required");
      }
      throw new Error(errorData.error || "Failed to start stream");
    }

    if (!resp.body) throw new Error("No response body");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let assistantContent = "";

    // Add empty assistant message
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") break;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantContent += content;
            setMessages(prev => {
              const newMessages = [...prev];
              newMessages[newMessages.length - 1] = { role: 'assistant', content: assistantContent };
              return newMessages;
            });
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    // Final flush
    if (textBuffer.trim()) {
      for (let raw of textBuffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (raw.startsWith(":") || raw.trim() === "") continue;
        if (!raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantContent += content;
            setMessages(prev => {
              const newMessages = [...prev];
              newMessages[newMessages.length - 1] = { role: 'assistant', content: assistantContent };
              return newMessages;
            });
          }
        } catch { /* ignore */ }
      }
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    const newMessages: Message[] = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      await streamChat(newMessages);
    } catch (error) {
      console.error("Chat error:", error);
      if (!(error instanceof Error && (error.message === "Rate limited" || error.message === "Payment required"))) {
        toast.error("Erro ao processar sua solicitação.");
      }
      // Remove empty assistant message on error
      setMessages(prev => prev.filter(m => m.content !== ''));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-32 right-8 z-50 w-full max-w-[420px] glass-card rounded-[2rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.9)] overflow-hidden border border-border flex flex-col h-[560px]">
      {/* Header */}
      <div className="p-5 bg-card border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary">smart_toy</span>
          </div>
          <div>
            <span className="font-black text-xs uppercase tracking-widest text-foreground">Polo AI</span>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Agente Executor</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[9px] font-semibold text-emerald-500 uppercase">Online</span>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-xl hover:bg-muted flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-muted-foreground hover:text-foreground">close</span>
          </button>
        </div>
      </div>
      
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] px-4 py-3 rounded-2xl text-sm ${
              msg.role === 'user' 
                ? 'bg-foreground text-background font-medium' 
                : 'bg-muted border border-border text-foreground'
            }`}>
              {msg.role === 'assistant' ? (
                <div className="prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:my-1 [&_ul]:my-1 [&_li]:my-0.5">
                  <ReactMarkdown>{msg.content || '...'}</ReactMarkdown>
                </div>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
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
            onKeyDown={handleKeyDown}
            placeholder="O que você precisa? Eu executo."
            disabled={isLoading}
            className="flex-1 bg-muted border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 placeholder:text-muted-foreground transition-colors disabled:opacity-50"
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="w-12 h-12 bg-primary text-primary-foreground rounded-xl flex items-center justify-center disabled:opacity-50 hover:scale-105 active:scale-95 transition-all shadow-[0_10px_30px_-10px_hsl(var(--primary)/0.5)]"
          >
            <span className="material-symbols-outlined">bolt</span>
          </button>
        </div>
      </div>
    </div>
  );
}
