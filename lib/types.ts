export type PromptType = 'text2img' | 'img2img';
export type Visibility = 'public' | 'private';
export type ImageRole = 'example' | 'reference' | 'generated';

export interface CollectionRow {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  cover_path: string | null;
  cover_thumb_path: string | null;
  is_public: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CollectionCard extends CollectionRow {
  prompt_count: number;
}

export interface PromptRow {
  id: number;
  title: string;
  type: PromptType;
  positive_prompt: string;
  negative_prompt: string | null;
  model: string | null;
  sampler: string | null;
  steps: number | null;
  cfg_scale: number | null;
  seed: string | null;
  width: number | null;
  height: number | null;
  lora: string | null;
  source_url: string | null;
  notes: string | null;
  visibility: Visibility;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface PromptImage {
  id: number;
  prompt_id: number;
  role: ImageRole;
  file_path: string;
  thumb_path: string;
  sort_order: number;
  created_at: string;
}

export interface PromptCard extends PromptRow {
  thumb: string | null;
  tags: string[];
}

export interface PromptDetail extends PromptRow {
  images: PromptImage[];
  tags: string[];
  collections: { id: number; name: string; slug: string; is_public: number }[];
}

export interface Paged<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
