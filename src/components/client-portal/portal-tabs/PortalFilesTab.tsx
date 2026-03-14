/**
 * PortalFilesTab - Aba Arquivos do portal com animações
 * Grid animado com stagger
 */

import { memo } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  FileText, 
  Image, 
  Film, 
  File, 
  Download,
  FolderOpen,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

function PortalFilesTabComponent({ files }: PortalFilesTabProps) {
  const getFileIcon = (fileType: string | null) => {
    if (!fileType) return <File className="w-5 h-5" />;
    if (fileType.includes('image')) return <Image className="w-5 h-5 text-primary" />;
    if (fileType.includes('video')) return <Film className="w-5 h-5 text-primary/70" />;
    if (fileType.includes('pdf')) return <FileText className="w-5 h-5 text-destructive" />;
    return <File className="w-5 h-5 text-gray-500" />;
  };

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
        <div className="w-14 h-14 bg-[#1a1a1a] flex items-center justify-center mx-auto mb-4">
          <FolderOpen className="w-7 h-7 text-gray-500" />
        </div>
        <h3 className="font-medium text-white mb-2">Nenhum arquivo disponível</h3>
        <p className="text-sm text-gray-500">
          Os arquivos do projeto aparecerão aqui quando forem compartilhados.
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
      {Object.entries(groupedFiles).map(([folder, folderFiles], folderIndex) => (
        <motion.div 
          key={folder} 
          className="bg-[#0a0a0a] border border-[#1a1a1a] p-4 md:p-6"
          variants={itemVariants}
        >
          <div className="flex items-center gap-2 mb-4">
            <FolderOpen className="w-5 h-5 text-primary" />
            <h3 className="font-medium text-white">{folder}</h3>
            <Badge variant="secondary" className="text-mono bg-[#1a1a1a] text-gray-400">
              {folderFiles.length} arquivo{folderFiles.length !== 1 ? 's' : ''}
            </Badge>
          </div>

          <div className="space-y-2">
            {folderFiles.map((file, fileIndex) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + fileIndex * 0.03 }}
                whileHover={{ x: 4, backgroundColor: 'rgba(6, 182, 212, 0.03)' }}
                className="flex items-center justify-between p-3 bg-[#0a0a0a] border border-[#1a1a1a] hover:border-gray-700 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-[#1a1a1a] flex items-center justify-center flex-shrink-0">
                    {getFileIcon(file.file_type)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {file.name}
                    </p>
                    <p className="text-mono text-gray-500">
                      {format(new Date(file.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-500 hover:text-white"
                    onClick={() => window.open(file.file_url, '_blank')}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-500 hover:text-white"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = file.file_url;
                      link.download = file.name;
                      link.click();
                    }}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

export const PortalFilesTab = memo(PortalFilesTabComponent);
