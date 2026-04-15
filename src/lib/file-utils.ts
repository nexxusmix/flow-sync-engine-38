/**
 * file-utils — helpers para exibicao de arquivos no portal do cliente
 *
 * Resolve tres problemas que estavam aparecendo no portal:
 *  1. Nome do arquivo vindo como UUID / vazio / hash do Supabase
 *  2. Ausencia de thumbnail para imagens (mostrava so icone)
 *  3. Tipo do arquivo nao detectado quando `file_type` vinha null
 */

// ==================== EXTENSOES ====================

const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif', 'heic', 'heif', 'bmp'] as const;
const VIDEO_EXTS = ['mp4', 'mov', 'webm', 'mkv', 'avi', 'm4v', 'flv'] as const;
const AUDIO_EXTS = ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac'] as const;
const DOC_EXTS = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'] as const;
const SHEET_EXTS = ['xls', 'xlsx', 'csv', 'tsv', 'numbers'] as const;
const SLIDE_EXTS = ['ppt', 'pptx', 'key'] as const;
const ARCHIVE_EXTS = ['zip', 'rar', '7z', 'tar', 'gz'] as const;
const DESIGN_EXTS = ['psd', 'ai', 'fig', 'sketch', 'xd'] as const;

export type FileKind =
  | 'image'
  | 'video'
  | 'audio'
  | 'pdf'
  | 'document'
  | 'spreadsheet'
  | 'presentation'
  | 'archive'
  | 'design'
  | 'other';

// ==================== NOME ====================

/**
 * Extrai um nome legivel a partir de uma URL de storage.
 * Lida com o padrao do Supabase: .../object/public/bucket/userId/uuid-nome.ext
 */
export function getFileNameFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const clean = url.split('?')[0].split('#')[0];
    const last = clean.split('/').pop() || '';
    // decodifica URI (nome pode ter espacos/acentos encoded)
    const decoded = decodeURIComponent(last);
    // se for padrao "uuid-nome.ext" mantem nome; se for so uuid, devolve tudo
    const match = decoded.match(/^[0-9a-f-]{8,}-(.+)$/i);
    return match ? match[1] : decoded || null;
  } catch {
    return null;
  }
}

/**
 * Nome de exibicao com cadeia de fallback.
 * Ordem: title > client_upload_name > nome da URL > 'Sem titulo'
 */
export function getDisplayName(opts: {
  title?: string | null;
  client_upload_name?: string | null;
  file_url?: string | null;
  name?: string | null;
  fallback?: string;
}): string {
  const candidates = [
    opts.title,
    opts.name,
    opts.client_upload_name,
    getFileNameFromUrl(opts.file_url),
  ];
  for (const c of candidates) {
    if (c && c.trim() && !isUuidLike(c)) return c.trim();
  }
  return opts.fallback || 'Arquivo sem titulo';
}

function isUuidLike(s: string): boolean {
  return /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i.test(s.trim());
}

// ==================== EXTENSAO / TIPO ====================

export function getExtension(url: string | null | undefined, name?: string | null): string {
  const source = name || getFileNameFromUrl(url) || '';
  const m = source.toLowerCase().match(/\.([a-z0-9]{2,6})$/);
  return m ? m[1] : '';
}

export function getFileKind(
  fileType: string | null | undefined,
  urlOrName?: string | null,
  fallbackName?: string | null,
): FileKind {
  const mime = (fileType || '').toLowerCase();
  const ext = getExtension(urlOrName, fallbackName);

  if (mime.startsWith('image/') || IMAGE_EXTS.includes(ext as any)) return 'image';
  if (mime.startsWith('video/') || VIDEO_EXTS.includes(ext as any)) return 'video';
  if (mime.startsWith('audio/') || AUDIO_EXTS.includes(ext as any)) return 'audio';
  if (mime.includes('pdf') || ext === 'pdf') return 'pdf';
  if (SHEET_EXTS.includes(ext as any) || mime.includes('spreadsheet') || mime.includes('excel')) return 'spreadsheet';
  if (SLIDE_EXTS.includes(ext as any) || mime.includes('presentation') || mime.includes('powerpoint')) return 'presentation';
  if (DOC_EXTS.includes(ext as any) || mime.includes('word') || mime.includes('document') || mime.startsWith('text/')) return 'document';
  if (ARCHIVE_EXTS.includes(ext as any) || mime.includes('zip') || mime.includes('compressed')) return 'archive';
  if (DESIGN_EXTS.includes(ext as any)) return 'design';
  return 'other';
}

// ==================== THUMBNAIL ====================

/**
 * Retorna URL de preview quando possivel (imagem = ela mesma).
 * Para videos/PDF/etc devolve null — caller usa icone.
 */
export function getFilePreviewUrl(opts: {
  file_url?: string | null;
  thumbnail_url?: string | null;
  file_type?: string | null;
  name?: string | null;
}): string | null {
  if (opts.thumbnail_url) return opts.thumbnail_url;
  const kind = getFileKind(opts.file_type, opts.file_url, opts.name);
  if (kind === 'image' && opts.file_url) return opts.file_url;
  return null;
}

// ==================== LABEL / COR ====================

export const KIND_LABEL: Record<FileKind, string> = {
  image: 'Imagem',
  video: 'Video',
  audio: 'Audio',
  pdf: 'PDF',
  document: 'Documento',
  spreadsheet: 'Planilha',
  presentation: 'Apresentacao',
  archive: 'Arquivo',
  design: 'Design',
  other: 'Arquivo',
};

export const KIND_ACCENT: Record<FileKind, string> = {
  image: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  video: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  audio: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
  pdf: 'bg-red-500/10 text-red-400 border-red-500/30',
  document: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  spreadsheet: 'bg-green-500/10 text-green-400 border-green-500/30',
  presentation: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  archive: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  design: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30',
  other: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
};

// ==================== INICIAIS (para avatar fallback) ====================

export function getInitials(name: string | null | undefined, max = 2): string {
  if (!name) return '?';
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '?';
  if (words.length === 1) return words[0].slice(0, max).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}
