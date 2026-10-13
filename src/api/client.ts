import { Category, PromptPost, PostDetailResponse, AdminUser, DashboardStats, SupabaseStatus } from '../types.ts';

const TOKEN_KEY = 'ts_prompt_admin_token';

export const authStorage = {
  getToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  setToken(token: string): void {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // ignore
    }
  },
  clearToken(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // ignore
    }
  }
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = authStorage.getToken();
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Add cache control headers to prevent stale 304 or cached empty results
  headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  headers.set('Pragma', 'no-cache');

  const response = await fetch(endpoint, {
    ...options,
    cache: 'no-store',
    headers
  });

  if (!response.ok) {
    let errorMsg = `Request failed (${response.status})`;
    try {
      const errorJson = await response.json();
      if (errorJson && errorJson.error) {
        errorMsg = errorJson.error;
      }
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return response.json() as Promise<T>;
}

export const api = {
  // Public APIs
  async getCategories(): Promise<Category[]> {
    return request<Category[]>(`/api/categories?_t=${Date.now()}`);
  },

  async getPosts(category?: string, search?: string): Promise<PromptPost[]> {
    const params = new URLSearchParams();
    if (category && category !== 'all') params.append('category', category);
    if (search && search.trim()) params.append('search', search.trim());
    params.append('_t', Date.now().toString());

    const qs = params.toString();
    return request<PromptPost[]>(`/api/posts${qs ? `?${qs}` : ''}`);
  },

  async getPostBySlug(slug: string): Promise<PostDetailResponse> {
    return request<PostDetailResponse>(`/api/posts/${encodeURIComponent(slug)}?_t=${Date.now()}`);
  },

  // Admin APIs
  async adminLogin(email: string, password: string): Promise<{ success: boolean; token: string; admin: AdminUser }> {
    const res = await request<{ success: boolean; token: string; admin: AdminUser }>('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (res.token) {
      authStorage.setToken(res.token);
    }
    return res;
  },

  async adminVerifySession(): Promise<{ authenticated: boolean; admin: AdminUser }> {
    return request<{ authenticated: boolean; admin: AdminUser }>('/api/admin/me');
  },

  async adminLogout(): Promise<void> {
    try {
      await request('/api/admin/logout', { method: 'POST' });
    } finally {
      authStorage.clearToken();
    }
  },

  async adminGetStats(): Promise<DashboardStats> {
    return request<DashboardStats>('/api/admin/stats');
  },

  async adminGetPosts(status?: string, category?: string, search?: string): Promise<PromptPost[]> {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.append('status', status);
    if (category && category !== 'all') params.append('category', category);
    if (search && search.trim()) params.append('search', search.trim());
    const qs = params.toString();
    return request<PromptPost[]>(`/api/admin/posts${qs ? `?${qs}` : ''}`);
  },

  async adminCreatePost(data: Partial<PromptPost>): Promise<{ success: boolean; post: PromptPost }> {
    return request<{ success: boolean; post: PromptPost }>('/api/admin/posts', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async adminUpdatePost(id: string, data: Partial<PromptPost>): Promise<{ success: boolean; post: PromptPost }> {
    return request<{ success: boolean; post: PromptPost }>(`/api/admin/posts/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async adminDeletePost(id: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/api/admin/posts/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
  },

  async adminUploadImage(file: File): Promise<{ success: boolean; url: string; filename: string }> {
    const formData = new FormData();
    formData.append('image', file);

    const token = authStorage.getToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch('/api/admin/upload', {
      method: 'POST',
      headers,
      body: formData
    });

    if (!response.ok) {
      let errorMsg = 'Upload failed';
      try {
        const data = await response.json();
        if (data.error) errorMsg = data.error;
      } catch {
        // ignore
      }
      throw new Error(errorMsg);
    }

    return response.json();
  },

  async adminClearSamples(): Promise<{ success: boolean; removedCount: number }> {
    return request<{ success: boolean; removedCount: number }>('/api/admin/clear-samples', {
      method: 'POST'
    });
  },

  async adminGetCategories(): Promise<Category[]> {
    return request<Category[]>('/api/admin/categories');
  },

  async adminCreateCategory(name: string): Promise<{ success: boolean; category: Category }> {
    return request<{ success: boolean; category: Category }>('/api/admin/categories', {
      method: 'POST',
      body: JSON.stringify({ name })
    });
  },

  async adminUpdateCategory(id: string, name: string): Promise<{ success: boolean; category: Category }> {
    return request<{ success: boolean; category: Category }>(`/api/admin/categories/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify({ name })
    });
  },

  async adminDeleteCategory(id: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/api/admin/categories/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
  },

  async adminChangePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>('/api/admin/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword })
    });
  },

  async adminGetSupabaseStatus(): Promise<SupabaseStatus> {
    return request<SupabaseStatus>('/api/admin/supabase-status');
  }
};
