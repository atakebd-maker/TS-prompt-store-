export interface Category {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface PromptPost {
  id: string;
  title: string;
  slug: string;
  category_id: string;
  category_name: string;
  featured_image_url: string;
  prompt_text: string;
  description: string;
  search_keywords: string;
  status: 'published' | 'draft';
  is_sample?: boolean;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface PostDetailResponse {
  post: PromptPost;
  related: PromptPost[];
}

export interface AdminUser {
  id: string;
  email: string;
}

export interface DashboardStats {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  totalCategories: number;
  samplePosts: number;
}

export interface SupabaseStatus {
  supabaseConfigured: boolean;
  supabaseUrl: string | null;
  storageBucket: string;
  sqlSchema: string;
}
