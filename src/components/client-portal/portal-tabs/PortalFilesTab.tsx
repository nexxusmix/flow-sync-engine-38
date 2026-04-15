/**
 * PortalFilesTab - Aba Arquivos do portal com animacoes
 * Grid animado com stagger
 *
 * v2: thumbnail universal (imagem renderiza preview real), nome com
 * fallback (evita UUIDs do Supabase Storage) e chip de tipo colorido.
 */

import { memo, useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  FileText,
  Image as ImageIcon,
  Film,
  File as FileIcon,
  Music,
  FileSpreadsheet,
  Presentation,
  Archive,
  Palette,
  Download,
  FolderOpen,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  getDisplayName,
  getFileKind,
  getFilePreviewUrl,
  KIND_LABEL,
  KIND_ACCENT,
  type FileKind,
} from "@/lib/file-utils";
import type { PortalFile } from "@/hooks/useClientPortalEnhanced";

interface PortalFilesTabProps {
  files: PortalFile[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25 },
  },
};

const KIND_ICON: Record<FileKind, JSX.Element> = {
  image: <ImageIcon className="w-5 h-5" />,
  video: <Film className="w-5 h-5" />,
  audio: <Music className="w-5 h-5" />,
  pdf: <FileText className="w-5 h-5" />,
  document: <FileText className="w-5 h-5" />,
  spreadsheet: <FileSpreadsheet className="w-5 h-5" />,
  presentation: <Presentation className="w-5 h-5" />,
  archive: <Archive className="w-5 h-5" />,
  design: <Palette className="w-5 h-5" />,
  other: <FileIcon className="w-5 h-5" />,
};

// ==================== Card individual ====================

function FileCard({ file, index }: { file: PortalFile; index: number }) {
  const [imgError, setImgError] = useState(false);

  const displayName = getDisplayName({
    name: file.name,
    file_url: file.file_url,
    fallback: 'Arquivo sem nome',
  });

  const kind: FileKind = getFileKind(file.file_type, file.file_url, displayName);
  const thumbnail = getFilePreviewUrl({
    file_url: file.file_url,
    file_type: file.file_type,
    name: displayName,
  });
  const canPreview = !!thumbnail && !imgError;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 + index * 0.03 }}
      whileHover={{ y: -2 }}
      className="group bg-[#0a0a0a] border border-[#1a1a1a] hover:border-cyan-500/40 transition-all overflow-hidden rounded-md"
    >
      {/* Thumbnail / Icon area */}
      <div className="relative aspect-[4/3] bg-[#111] flex items-center justify-center overflow-hidden">
        {canPreview ? (
          <img
            src={thumbnail!}
            alt={displayName}
            loading="lazy"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center border",
              KIND_ACCENT[kind]
            )}>
              {KIND_ICON[kind]}
            </div>
            <span className={cn(
              "text-[9px] uppercase tracking-[0.15em] px-2 py-0.5 rounded border",
              KIND_ACCENT[kind]
            )}>
              {KIND_LABEL[kind]}
            </span>
          </div>
        )}

        {/* Hover actions */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="h-8 text-xs"
            onClick={() => window.open(file.file_url, '_blank')}
          >
            <Eye className="w-3.5 h-3.5 mr-1.5" />
            Abrir
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="h-8 text-xs"
            onClick={() => {
              const a = document.createElement('a');
              a.href = file.file_url;
              a.setAttribute('download', displayName);
              a.setAttribute('target', '_blank');
              document.body.appendChild(a);
              a.click();
              a.remove();
            }}
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Baixar
          </Button>
        </div>

        {/* Chip do tipo quando tem preview */}
        {canPreview && (
          <span className={cn(
            "absolute top-2 left-2 text-[9px] uppercase tracking-[0.15em] px-2 py-0.5 rounded border bg-black/60 backdrop-blur",
            KIND_ACCENT[kind]
          )}>
            {KIND_LABEL[kind]}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-1">
        <p className="text-sm font-medium text-white truncate" title={displayName}>
          {displayName}
        </p>
        <p className="text-mono text-gray-500 text-[11px]">
          {format(new Date(file.created_at), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })}
        </p>
      </div>
    </motion.div>
  );
}

// ==================== Tab ====================

function PortalFilesTabComponent({ files }: PortalFilesTabProps) {
  // Group files by folder
  const groupedFiles = files.reduce((acc, file) => {
    const folder = file.folder || 'Geral';
    if (!acc[folder]) acc[folder] = [];
    acc[folder].push(file);
    return acc;
  }, {} as Record<string, PortalFile[]>);

  if (files.length === 0) {
    return (
      <motion.div
        className="bg-[#0a0a0a] border border-[#1a1a1a] p-8 text-center"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="w-14 h-14 bg-[#1a1a1a] flex items-center justify-center mx-auto mb-4 rounded-lg">
          <FolderOpen className="w-7 h-7 text-gray-500" />
        </div>
        <h3 className="font-medium text-white mb-2">Nenhum arquivo disponivel</h3>
        <p className="text-sm text-gray-500">
          Os arquivos do projeto aparecerao aqui quando forem compartilhados.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {Object.entries(groupedFiles).map(([folder, folderFiles]) => (
        <motion.div
          key={folder}
          className="bg-[#0a0a0a] border border-[#1a1a1a] p-4 md:p-6 rounded-lg"
          variants={itemVariants}
        >
          <div className="flex items-center gap-2 mb-4">
            <FolderOpen className="w-5 h-5 text-primary" />
            <h3 className="font-medium text-white">{folder}</h3>
            <Badge variant="secondary" className="text-mono bg-[#1a1a1a] text-gray-400">
              {folderFiles.length} arquivo{folderFiles.length !== 1 ? 's' : ''}
            </Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {folderFiles.map((file, fileIndex) => (
              <FileCard key={file.id} file={file} index={fileIndex} />
            ))}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

export const PortalFilesTab = memo(PortalFilesTabComponent);
