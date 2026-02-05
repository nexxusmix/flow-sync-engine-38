// Project Updates Types

export type UpdateType = 'text' | 'image' | 'audio' | 'mixed';

export interface ProjectUpdate {
  id: string;
  projectId: string;
  type: UpdateType;
  content: string; // Main text content or transcription
  originalContent?: string; // Original audio transcription before summary
  imageUrls?: string[]; // Screenshot URLs
  audioUrl?: string; // Audio file URL
  summary?: string; // AI-generated summary
  clientRequests?: string[]; // Extracted client requests
  author: string;
  authorType: 'team' | 'client' | 'system';
  createdAt: string;
  updatedAt: string;
  isProcessing?: boolean;
  metadata?: {
    audioDuration?: number;
    imageCount?: number;
    aiModel?: string;
  };
}

export interface ProjectUpdateInput {
  text?: string;
  images?: File[];
  audio?: File;
}
