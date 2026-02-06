import { ConceptContent, ScriptContent, StoryboardScene, ShotlistItem, MoodboardContent } from "./creative-studio";

export interface CreativePackageContent {
  concept?: ConceptContent;
  script?: ScriptContent;
  storyboard?: StoryboardScene[];
  shotlist?: ShotlistItem[];
  moodboard?: MoodboardContent;
  images?: string[];
  captionVariations?: string[];
  hashtags?: string[];
}

export interface CreativePackage {
  id: string;
  campaign_id: string;
  studio_run_id?: string | null;
  title: string;
  package_json: CreativePackageContent;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export type CreativePackageInsert = Omit<CreativePackage, 'id' | 'created_at' | 'updated_at'>;
