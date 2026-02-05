import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

interface UploadedFile {
  name: string;
  type: string;
  content?: string;
  size: number;
  isProcessing?: boolean;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  files?: UploadedFile[];
}

interface AIAssistantProps {
  onClose: () => void;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/polo-ai-chat`;

export function AIAssistant({ onClose }: AIAssistantProps) {
  const location = useLocation();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "**Polo AI ativo.** Sou seu agente executor autônomo. Diga o que precisa e eu executo. Você pode anexar arquivos para análise." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingFiles(true);
    const newFiles: UploadedFile[] = [];

    for (const file of Array.from(files)) {
      const fileInfo: UploadedFile = {
        name: file.name,
        type: file.type,
        size: file.size,
        isProcessing: true,
      };

      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`Arquivo ${file.name} muito grande (máx 10MB)`);
        continue;
      }

      try {
        // Process based on file type
        if (file.type.startsWith('text/') || 
            file.name.endsWith('.json') || 
            file.name.endsWith('.csv') ||
            file.name.endsWith('.md') ||
            file.name.endsWith('.txt')) {
          fileInfo.content = await readFileAsText(file);
        } else if (file.type === 'application/pdf' || 
                   file.type.includes('word') ||
                   file.type.includes('spreadsheet') ||
                   file.type.includes('excel')) {
          // For complex documents, read as base64 for potential processing
          fileInfo.content = `[Arquivo binário: ${file.name}] - Tipo: ${file.type}`;
        } else if (file.type.startsWith('image/')) {
          const base64 = await readFileAsBase64(file);
          fileInfo.content = `[Imagem: ${file.name}]\nBase64 preview disponível para análise visual.`;
        } else {
          fileInfo.content = `[Arquivo: ${file.name}] - Tipo: ${file.type}`;
        }

        fileInfo.isProcessing = false;
        newFiles.push(fileInfo);
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        toast.error(`Erro ao processar ${file.name}`);
      }
    }

    setUploadedFiles(prev => [...prev, ...newFiles]);
    setIsProcessingFiles(false);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (newFiles.length > 0) {
      toast.success(`${newFiles.length} arquivo(s) anexado(s)`);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const streamChat = async (userMessages: Message[]) => {
    const context = {
      currentRoute: location.pathname,
      timestamp: new Date().toISOString(),
    };

    // Include file contents in the message
    const processedMessages = userMessages.map(m => {
      let content = m.content;
      if (m.files && m.files.length > 0) {
        const fileContents = m.files.map(f => 
          `\n\n---\n📎 **Arquivo: ${f.name}** (${(f.size / 1024).toFixed(1)}KB)\n${f.content || '[Conteúdo não disponível]'}\n---`
        ).join('');
        content = content + fileContents;
      }
      return { role: m.role, content };
    });

    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ 
        messages: processedMessages,
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
    if ((!input.trim() && uploadedFiles.length === 0) || isLoading) return;

    const userMsg = input.trim() || "Analise os arquivos anexados.";
    const newMessage: Message = { 
      role: 'user', 
      content: userMsg,
      files: uploadedFiles.length > 0 ? [...uploadedFiles] : undefined
    };
    const newMessages: Message[] = [...messages, newMessage];
    
    setMessages(newMessages);
    setInput('');
    setUploadedFiles([]);
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

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
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
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-green-500/10 border border-green-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-[9px] font-semibold text-green-500 uppercase">Online</span>
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
                <div>
                  <span>{msg.content}</span>
                  {msg.files && msg.files.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {msg.files.map((f, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 text-[10px] bg-background/20 px-2 py-0.5 rounded">
                          <span className="material-symbols-outlined text-xs">attach_file</span>
                          {f.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
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

      {/* Uploaded Files Preview */}
      {uploadedFiles.length > 0 && (
        <div className="px-4 py-2 border-t border-border bg-muted/50">
          <div className="flex flex-wrap gap-2">
            {uploadedFiles.map((file, idx) => (
              <div 
                key={idx} 
                className="flex items-center gap-2 bg-card border border-border rounded-lg px-2 py-1 text-xs"
              >
                <span className="material-symbols-outlined text-sm text-primary">
                  {file.type.startsWith('image/') ? 'image' : 
                   file.type.includes('pdf') ? 'picture_as_pdf' : 
                   file.type.includes('sheet') || file.type.includes('excel') ? 'table_chart' :
                   'description'}
                </span>
                <span className="max-w-[100px] truncate">{file.name}</span>
                <span className="text-muted-foreground">{formatFileSize(file.size)}</span>
                <button 
                  onClick={() => removeFile(idx)}
                  className="hover:text-destructive transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-border bg-card/80">
        <div className="flex gap-2">
          {/* File Upload Button */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".txt,.md,.json,.csv,.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.webp"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || isProcessingFiles}
            className="w-12 h-12 bg-muted border border-border rounded-xl flex items-center justify-center hover:bg-accent transition-colors disabled:opacity-50"
            title="Anexar arquivos"
          >
            {isProcessingFiles ? (
              <span className="material-symbols-outlined animate-spin">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined">attach_file</span>
            )}
          </button>
          
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={uploadedFiles.length > 0 ? "Descreva o que fazer com os arquivos..." : "O que você precisa? Eu executo."}
            disabled={isLoading}
            className="flex-1 bg-muted border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 placeholder:text-muted-foreground transition-colors disabled:opacity-50"
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || (!input.trim() && uploadedFiles.length === 0)}
            className="w-12 h-12 bg-primary text-primary-foreground rounded-xl flex items-center justify-center disabled:opacity-50 hover:scale-105 active:scale-95 transition-all shadow-[0_10px_30px_-10px_hsl(var(--primary)/0.5)]"
          >
            <span className="material-symbols-outlined">bolt</span>
          </button>
        </div>
      </div>
    </div>
  );
}
