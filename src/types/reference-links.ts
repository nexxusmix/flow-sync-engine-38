// Reference Links Types

export type ReferenceEntityType = 'idea' | 'content';

export interface ReferenceLink {
  id: string;
  reference_id: string;
  entity_type: ReferenceEntityType;
  entity_id: string;
  created_at: string;
}

export interface ReferenceLinkWithDetails extends ReferenceLink {
  reference?: {
    id: string;
    thumbnail_url?: string;
    media_url?: string;
    permalink?: string;
    caption?: string;
    note?: string;
    media_type?: string;
    tags?: string[];
  };
}

export const REFERENCE_MEDIA_TYPES = [
  { value: 'post', label: 'Post' },
  { value: 'reel', label: 'Reel' },
  { value: 'story', label: 'Story' },
  { value: 'carousel', label: 'Carrossel' },
] as const;

export type ReferenceMediaType = typeof REFERENCE_MEDIA_TYPES[number]['value'];
