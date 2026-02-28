import { useState, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Mic, Upload, Loader2, Copy, Check, FileAudio, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface TranscriptionResult {
  id: string;
  fileName: string;
  text: string;
  createdAt: Date;
}

export default function TranscribePage() {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [results, setResults] = useState<TranscriptionResult[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTranscribe = async (file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 20MB.");
      return;
    }

    setIsTranscribing(true);
    toast.info(`Transcrevendo "${file.name}"...`);

    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke("transcribe-media", {
        body: {
          audioBase64: base64,
          mimeType: file.type,
          fileName: file.name,
        },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      const transcription = data?.transcription || "";
      if (!transcription.trim()) {
        toast.warning("Nenhum conteúdo detectado no áudio/vídeo.");
        return;
      }

      setResults((prev) => [
        {
          id: crypto.randomUUID(),
          fileName: file.name,
          text: transcription,
          createdAt: new Date(),
        },
        ...prev,
      ]);
      toast.success("Transcrição concluída!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao transcrever");
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file) => handleTranscribe(file));
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const copyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Texto copiado!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const removeResult = (id: string) => {
    setResults((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <DashboardLayout title="Transcrição de Mídia">
      <div className="space-y-6 max-w-[1200px] mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-medium text-foreground flex items-center gap-3">
            <Mic className="w-6 h-6 text-primary" />
            Transcrição de Áudio & Vídeo
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Envie arquivos de áudio ou vídeo para transcrever automaticamente com IA
          </p>
        </div>

        {/* Upload Area */}
        <Card
          className={cn(
            "border-dashed border-2 transition-colors",
            "border-border/60 hover:border-primary/30"
          )}
          onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-primary', 'bg-primary/5'); }}
          onDragLeave={(e) => { e.currentTarget.classList.remove('border-primary', 'bg-primary/5'); }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove('border-primary', 'bg-primary/5');
            const files = e.dataTransfer.files;
            if (files) Array.from(files).forEach(f => handleTranscribe(f));
          }}
        >
          <CardContent className="flex flex-col items-center justify-center py-12">
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,video/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              {isTranscribing ? (
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              ) : (
                <Upload className="w-8 h-8 text-primary" />
              )}
            </div>
            <h3 className="font-medium text-foreground mb-1">
              {isTranscribing ? "Transcrevendo..." : "Arraste ou selecione mídia para transcrição"}
            </h3>
            <p className="text-xs text-muted-foreground mb-4 text-center max-w-sm">
              MP3, MP4, WAV, M4A, WebM, OGG — máximo 20MB por arquivo
            </p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isTranscribing}
              className="gap-2"
            >
              {isTranscribing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {isTranscribing ? "Processando..." : "Selecionar Arquivos"}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Transcrições ({results.length})
            </h2>
            {results.map((result) => (
              <Card key={result.id}>
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileAudio className="w-4 h-4 text-primary" />
                    <CardTitle className="text-sm font-medium">{result.fileName}</CardTitle>
                    <Badge variant="outline" className="text-[10px]">
                      {result.createdAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => copyText(result.id, result.text)}
                    >
                      {copiedId === result.id ? (
                        <Check className="w-3.5 h-3.5 text-primary" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => removeResult(result.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                </CardHeader>
                <Separator />
                <CardContent className="pt-3">
                  <Textarea
                    value={result.text}
                    onChange={(e) =>
                      setResults((prev) =>
                        prev.map((r) => (r.id === result.id ? { ...r, text: e.target.value } : r))
                      )
                    }
                    className="min-h-[120px] text-sm"
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
