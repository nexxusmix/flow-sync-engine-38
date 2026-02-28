import { useState, useRef, useCallback } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface DropZoneProps {
  onFiles: (files: File[]) => void;
  multiple?: boolean;
  accept?: string;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
  /** Compact mode for inline areas */
  compact?: boolean;
}

export function DropZone({
  onFiles,
  multiple = true,
  accept,
  disabled = false,
  className,
  children,
  compact = false,
}: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.items?.length) setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCounterRef.current = 0;
      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        onFiles(multiple ? files : [files[0]]);
      }
    },
    [disabled, multiple, onFiles]
  );

  const handleClick = () => {
    if (!disabled) inputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onFiles(multiple ? files : [files[0]]);
    }
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
      className={cn(
        "border-2 border-dashed rounded-xl transition-all cursor-pointer",
        isDragging
          ? "border-primary bg-primary/5 scale-[1.01]"
          : "border-border/60 hover:border-primary/40 hover:bg-muted/30",
        disabled && "opacity-50 cursor-not-allowed",
        compact ? "p-3" : "p-6",
        className
      )}
    >
      <input
        ref={inputRef}
        type="file"
        multiple={multiple}
        accept={accept}
        className="hidden"
        onChange={handleInputChange}
        disabled={disabled}
      />

      {children || (
        <div className={cn("flex flex-col items-center justify-center text-center", compact ? "gap-1" : "gap-2")}>
          <Upload className={cn("text-muted-foreground", compact ? "w-5 h-5" : "w-8 h-8")} />
          <p className={cn("text-muted-foreground", compact ? "text-xs" : "text-sm")}>
            {isDragging ? "Solte os arquivos aqui" : "Arraste arquivos aqui ou clique para selecionar"}
          </p>
          {!compact && (
            <p className="text-[10px] text-muted-foreground/60">
              Qualquer tipo de arquivo — imagens, vídeos, PDFs, ZIPs, documentos...
            </p>
          )}
        </div>
      )}
    </div>
  );
}
