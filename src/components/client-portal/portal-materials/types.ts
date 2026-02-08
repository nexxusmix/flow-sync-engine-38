/**
 * Types for Portal Materials system with versioning and changelog
 */

export interface ChangelogItem {
  description: string;
  category?: string;
}

export interface PortalMaterialVersion {
  id: string;
  deliverable_id: string;
  version_number: number;
  title: string | null;
  notes: string | null;
  file_url: string | null;
  created_at: string;
  created_by_name: string | null;
  change_tags: string[];
  changelog_items: ChangelogItem[];
}

// Predefined revision tags with colors
export const REVISION_TAGS = [
  { id: 'color', label: 'Cor/Grade', color: 'bg-purple-500' },
  { id: 'audio', label: 'Áudio', color: 'bg-blue-500' },
  { id: 'cut', label: 'Corte', color: 'bg-amber-500' },
  { id: 'graphics', label: 'Grafismos', color: 'bg-emerald-500' },
  { id: 'vo', label: 'Locução', color: 'bg-pink-500' },
  { id: 'music', label: 'Música', color: 'bg-cyan-500' },
  { id: 'text', label: 'Texto', color: 'bg-orange-500' },
  { id: 'other', label: 'Outros', color: 'bg-gray-500' },
] as const;

export type RevisionTagId = typeof REVISION_TAGS[number]['id'];

export function getTagConfig(tagId: string) {
  return REVISION_TAGS.find(t => t.id === tagId) || REVISION_TAGS[REVISION_TAGS.length - 1];
}
