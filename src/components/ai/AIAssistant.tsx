import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { useAgentChat } from "@/hooks/useAgentChat";
import { ExecutionPlanView } from "./ExecutionPlanView";
import type { AttachmentInfo } from "@/types/agent";
import { cn } from "@/lib/utils";

interface UploadedFile {
  name: string;
  type: string;
  content?: string;
  size: number;
}

interface AIAssistantProps {
  onClose: () => void;
}

export function AIAssistant({ onClose }: AIAssistantProps) {
  const location = useLocation();
  const {
    conversations,
    activeConversationId,
    messages,
    memories,
    isLoading,
    isExecuting,
    sendMessage,
    selectConversation,
    createConversation,
    deleteConversation,
    handleExecutePlan,
    cancelStream,
    setMessages,
  } = useAgentChat();

  const [input, setInput] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-select the most recent conversation on mount if none is active
  useEffect(() => {
    if (!activeConversationId && conversations.length > 0) {
      selectConversation(conversations[0].id);
    }
  }, [conversations, activeConversationId, selectConversation]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const readFileAsText = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsProcessingFiles(true);
    const newFiles: UploadedFile[] = [];

    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`Arquivo ${file.name} muito grande (máx 10MB)`);
        continue;
      }
      try {
        let content: string | undefined;
        if (file.type.startsWith('text/') || /\.(json|csv|md|txt)$/.test(file.name)) {
          content = await readFileAsText(file);
        } else {
          content = `[Arquivo: ${file.name}] - Tipo: ${file.type}`;
        }
        newFiles.push({ name: file.name, type: file.type, size: file.size, content });
      } catch {
        toast.error(`Erro ao processar ${file.name}`);
      }
    }

    setUploadedFiles(prev => [...prev, ...newFiles]);
    setIsProcessingFiles(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (newFiles.length > 0) toast.success(`${newFiles.length} arquivo(s) anexado(s)`);
  };

  const removeFile = (index: number) => setUploadedFiles(prev => prev.filter((_, i) => i !== index));

  const handleSend = async () => {
    if ((!input.trim() && uploadedFiles.length === 0) || isLoading) return;
    const text = input.trim() || 'Analise os arquivos anexados.';
    const files: AttachmentInfo[] = uploadedFiles.map(f => ({
      name: f.name,
      type: f.type,
      size: f.size,
      content: f.content,
    }));
    setInput('');
    setUploadedFiles([]);
    await sendMessage(text, files, location.pathname);
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

  const handleNewChat = async () => {
    await createConversation();
    setShowSidebar(false);
  };

  return (
    <div className="fixed bottom-32 right-8 z-50 w-full max-w-[480px] glass-card rounded-[2rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.9)] overflow-hidden border border-border flex h-[600px]">
      
      {/* Conversations Sidebar */}
      {showSidebar && (
        <div className="w-[200px] border-r border-border bg-card flex flex-col shrink-0">
          <div className="p-3 border-b border-border">
            <button
              onClick={handleNewChat}
              className="w-full py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity"
            >
              + Nova conversa
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => { selectConversation(conv.id); setShowSidebar(false); }}
                className={cn(
                  "w-full text-left px-3 py-2.5 text-xs border-b border-border/50 hover:bg-muted transition-colors group",
                  activeConversationId === conv.id && "bg-muted"
                )}
              >
                <p className="truncate font-medium text-foreground">{conv.title}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {new Date(conv.updated_at).toLocaleDateString('pt-BR')}
                </p>
              </button>
            ))}
            {conversations.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-6">Nenhuma conversa</p>
            )}
          </div>
          {memories.length > 0 && (
            <div className="p-2 border-t border-border">
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider text-center">
                🧠 {memories.length} memória{memories.length > 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Main Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="p-4 bg-card border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="w-8 h-8 rounded-xl hover:bg-muted flex items-center justify-center transition-colors"
              title="Conversas"
            >
              <span className="material-symbols-outlined text-muted-foreground text-lg">
                {showSidebar ? 'chevron_left' : 'menu'}
              </span>
            </button>
            <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-sm">smart_toy</span>
            </div>
            <div>
              <span className="font-black text-xs uppercase tracking-widest text-foreground">Polo AI</span>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Agente Autônomo</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-green-500/10 border border-green-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[9px] font-semibold text-green-500 uppercase">Online</span>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-muted flex items-center justify-center transition-colors">
              <span className="material-symbols-outlined text-muted-foreground hover:text-foreground">close</span>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-primary text-2xl">auto_awesome</span>
              </div>
              <p className="text-sm font-semibold text-foreground">Polo AI pronto</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[250px]">
                Diga o que precisa → Receba plano → Execução automática ou com 1 clique.
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={cn(
                "max-w-[90%] px-4 py-3 rounded-2xl text-sm",
                msg.role === 'user'
                  ? 'bg-foreground text-background font-medium'
                  : 'bg-muted border border-border text-foreground'
              )}>
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

              {/* Execution Plan */}
              {msg.plan && (
                <div className="max-w-[90%] mt-2">
                  <ExecutionPlanView
                    plan={msg.plan}
                    results={msg.results}
                    isExecuting={isExecuting && msg.runId !== undefined && !msg.results}
                    needsConfirmation={msg.needsConfirmation}
                    onConfirm={() => handleExecutePlan(i)}
                    onCancel={() => {
                      setMessages(prev => {
                        const newMsgs = [...prev];
                        newMsgs[i] = { ...newMsgs[i], needsConfirmation: false, plan: undefined };
                        return newMsgs;
                      });
                    }}
                  />
                  {msg.plan && !msg.results && !isExecuting && !msg.needsConfirmation && (
                    <button
                      onClick={() => handleExecutePlan(i)}
                      className="mt-3 w-full py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
                    >
                      <span className="material-symbols-outlined text-lg">bolt</span>
                      EXECUTAR TUDO
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}

          {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
            <div className="flex justify-start">
              <div className="bg-muted border border-border px-4 py-3 rounded-2xl">
                <span className="flex gap-1.5">
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Uploaded Files Preview */}
        {uploadedFiles.length > 0 && (
          <div className="px-4 py-2 border-t border-border bg-muted/50 shrink-0">
            <div className="flex flex-wrap gap-2">
              {uploadedFiles.map((file, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-card border border-border rounded-lg px-2 py-1 text-xs">
                  <span className="material-symbols-outlined text-sm text-primary">
                    {file.type.startsWith('image/') ? 'image' : file.type.includes('pdf') ? 'picture_as_pdf' : 'description'}
                  </span>
                  <span className="max-w-[100px] truncate">{file.name}</span>
                  <span className="text-muted-foreground">{formatFileSize(file.size)}</span>
                  <button onClick={() => removeFile(idx)} className="hover:text-destructive transition-colors">
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-border bg-card/80 shrink-0">
          <div className="flex gap-2">
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
              className="w-10 h-10 bg-muted border border-border rounded-xl flex items-center justify-center hover:bg-accent transition-colors disabled:opacity-50 shrink-0"
              title="Anexar arquivos"
            >
              {isProcessingFiles ? (
                <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined text-sm">attach_file</span>
              )}
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={uploadedFiles.length > 0 ? 'Descreva o que fazer com os arquivos...' : 'O que você precisa? Eu executo.'}
              disabled={isLoading}
              className="flex-1 bg-muted border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 placeholder:text-muted-foreground transition-colors disabled:opacity-50 min-w-0"
            />
            <button
              onClick={isLoading ? cancelStream : handleSend}
              disabled={!isLoading && !input.trim() && uploadedFiles.length === 0}
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0",
                isLoading
                  ? "bg-destructive text-destructive-foreground hover:opacity-90"
                  : "bg-primary text-primary-foreground disabled:opacity-50 hover:scale-105 active:scale-95 shadow-[0_10px_30px_-10px_hsl(var(--primary)/0.5)]"
              )}
            >
              <span className="material-symbols-outlined text-sm">
                {isLoading ? 'stop' : 'bolt'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
