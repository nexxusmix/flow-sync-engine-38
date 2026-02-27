import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Project } from "@/types/projects";
import { ProjectUpdate } from "@/types/projectUpdates";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  FileText, 
  Image as ImageIcon, 
  Mic, 
  X, 
  Loader2, 
  Sparkles,
  Upload,
  StopCircle,
  Play,
  Trash2
} from "lucide-react";

interface AddUpdateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  onUpdateAdded: (update: ProjectUpdate) => void;
}

export function AddUpdateModal({ open, onOpenChange, project, onUpdateAdded }: AddUpdateModalProps) {
  const [text, setText] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState("");
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setImages(prev => [...prev, ...files]);
      
      // Create preview URLs
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreviewUrls(prev => [...prev, e.target?.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([audioBlob], `recording_${Date.now()}.webm`, { type: 'audio/webm' });
        setAudioFile(file);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.info("Gravando áudio...");
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Erro ao acessar microfone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.success("Áudio gravado com sucesso!");
    }
  };

  const removeAudio = () => {
    setAudioFile(null);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix to get just base64
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async () => {
    if (!text && images.length === 0 && !audioFile) {
      toast.error("Adicione pelo menos um conteúdo (texto, imagem ou áudio)");
      return;
    }

    setIsProcessing(true);
    
    try {
      // Prepare data for AI processing
      const requestData: Record<string, unknown> = {
        projectTitle: project.title,
        clientName: project.client.name,
      };

      if (text) {
        requestData.text = text;
        setProcessingStep("Analisando texto...");
      }

      if (audioFile) {
        setProcessingStep("Transcrevendo áudio...");
        requestData.audioBase64 = await fileToBase64(audioFile);
      }

      if (images.length > 0) {
        setProcessingStep("Analisando imagens...");
        const imageBase64List = await Promise.all(
          images.map(img => fileToBase64(img))
        );
        requestData.imageBase64List = imageBase64List;
      }

      setProcessingStep("Gerando resumo com IA...");

      const { data, error } = await supabase.functions.invoke('process-project-update', {
        body: requestData
      });

      if (error) throw error;

      // Create the update object
      const updateType = audioFile ? 'audio' : images.length > 0 ? (text ? 'mixed' : 'image') : 'text';
      
      const newUpdate: ProjectUpdate = {
        id: `update-${Date.now()}`,
        projectId: project.id,
        type: updateType,
        content: data.summary || text,
        originalContent: data.originalContent,
        summary: data.summary,
        clientRequests: data.clientRequests || [],
        author: project.owner.name,
        authorType: 'team',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
          imageCount: images.length,
          aiModel: 'gemini-3-flash-preview'
        }
      };

      onUpdateAdded(newUpdate);
      
      // Reset form
      setText("");
      setImages([]);
      setImagePreviewUrls([]);
      setAudioFile(null);
      onOpenChange(false);
      
      toast.success("Atualização processada e adicionada com sucesso!");
      
    } catch (error) {
      console.error("Error processing update:", error);
      toast.error("Erro ao processar atualização. Tente novamente.");
    } finally {
      setIsProcessing(false);
      setProcessingStep("");
    }
  };

  const hasContent = text || images.length > 0 || audioFile;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Nova Atualização do Projeto
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Text Input */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Texto / Anotações
            </Label>
            <Textarea
              placeholder="Descreva a atualização, feedback do cliente, alterações solicitadas..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[120px] resize-none"
              disabled={isProcessing}
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Prints de Conversa / Imagens
            </Label>
            
            <div className="flex flex-wrap gap-3">
              <AnimatePresence>
                {imagePreviewUrls.map((url, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="relative group"
                  >
                    <img 
                      src={url} 
                      alt={`Preview ${index + 1}`}
                      className="w-20 h-20 object-cover rounded-lg border border-border"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      disabled={isProcessing}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-1 hover:border-primary hover:bg-primary/5 transition-colors"
                disabled={isProcessing}
              >
                <Upload className="w-5 h-5 text-muted-foreground" />
                <span className="text-caption text-muted-foreground">Adicionar</span>
              </button>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>

          {/* Audio Recording */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Mic className="w-4 h-4" />
              Áudio / Gravação
            </Label>
            
            <div className="flex items-center gap-3">
              {!audioFile ? (
                <>
                  {!isRecording ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={startRecording}
                        disabled={isProcessing}
                        className="gap-2"
                      >
                        <Mic className="w-4 h-4" />
                        Gravar Áudio
                      </Button>
                      <span className="text-muted-foreground text-xs">ou</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => audioInputRef.current?.click()}
                        disabled={isProcessing}
                        className="gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        Upload Áudio
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={stopRecording}
                      className="gap-2 animate-pulse"
                    >
                      <StopCircle className="w-4 h-4" />
                      Parar Gravação
                    </Button>
                  )}
                </>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 bg-muted/50 rounded-lg px-4 py-2 flex-1"
                >
                  <Play className="w-4 h-4 text-primary" />
                  <span className="text-sm text-foreground flex-1 truncate">
                    {audioFile.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {(audioFile.size / 1024).toFixed(1)} KB
                  </span>
                  <button
                    onClick={removeAudio}
                    className="w-6 h-6 rounded-full hover:bg-destructive/20 flex items-center justify-center transition-colors"
                    disabled={isProcessing}
                  >
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </button>
                </motion.div>
              )}
            </div>
            
            <input
              ref={audioInputRef}
              type="file"
              accept="audio/*"
              onChange={handleAudioSelect}
              className="hidden"
            />
          </div>

          {/* AI Processing Info */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-normal text-foreground">Processamento com IA</p>
                <p className="text-xs text-muted-foreground mt-1">
                  A IA irá transcrever áudios, analisar imagens e gerar um resumo automático 
                  com os pedidos do cliente e informações importantes.
                </p>
              </div>
            </div>
          </div>

          {/* Processing State */}
          <AnimatePresence>
            {isProcessing && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-muted/50 rounded-xl p-4 flex items-center gap-3"
              >
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
                <span className="text-sm text-foreground">{processingStep}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!hasContent || isProcessing}
              className="gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Processar com IA
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
