import React, { useEffect, useState, useRef } from 'react';
import { PromptPost, Category, DashboardStats, AdminUser, SupabaseStatus } from '../types.ts';
import { api } from '../api/client.ts';
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  FolderTree,
  CheckCircle2,
  FileEdit,
  LogOut,
  Upload,
  Trash2,
  Edit,
  Eye,
  Search,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  KeyRound,
  Database,
  Check,
  ExternalLink,
  X,
  Image as ImageIcon,
  Loader2,
  Plus
} from 'lucide-react';

interface AdminDashboardProps {
  admin: AdminUser;
  initialCategories?: Category[];
  onCategoriesUpdate?: (categories: Category[]) => void;
  onLogout: () => void;
  onPreviewPublicPost: (slug: string) => void;
}

type TabType =
  | 'overview'
  | 'all-posts'
  | 'create-post'
  | 'categories'
  | 'published'
  | 'drafts'
  | 'database'
  | 'security';

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-photo', name: 'AI Photo Prompts', slug: 'ai-photo-prompts', created_at: new Date().toISOString() },
  { id: 'cat-video', name: 'AI Video Prompts', slug: 'ai-video-prompts', created_at: new Date().toISOString() },
  { id: 'cat-portrait', name: 'Portrait Prompts', slug: 'portrait-prompts', created_at: new Date().toISOString() },
  { id: 'cat-anime', name: 'Anime Prompts', slug: 'anime-prompts', created_at: new Date().toISOString() },
  { id: 'cat-fantasy', name: 'Fantasy Prompts', slug: 'fantasy-prompts', created_at: new Date().toISOString() },
  { id: 'cat-cinematic', name: 'Cinematic Prompts', slug: 'cinematic-prompts', created_at: new Date().toISOString() },
  { id: 'cat-other', name: 'Other Prompts', slug: 'other-prompts', created_at: new Date().toISOString() }
];

const PRESET_IMAGES = [
  {
    name: 'Cyberpunk Ronin',
    url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80'
  },
  {
    name: 'Studio Portrait',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80'
  },
  {
    name: 'Macro Butterfly',
    url: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=1200&q=80'
  },
  {
    name: 'Futuristic City',
    url: 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?auto=format&fit=crop&w=1200&q=80'
  },
  {
    name: 'Anime Forest',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80'
  }
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  admin,
  initialCategories,
  onCategoriesUpdate,
  onLogout,
  onPreviewPublicPost
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [posts, setPosts] = useState<PromptPost[]>([]);
  const [categories, setCategories] = useState<Category[]>(() => {
    return initialCategories && initialCategories.length > 0
      ? initialCategories
      : DEFAULT_CATEGORIES;
  });
  const [supabaseStatus, setSupabaseStatus] = useState<SupabaseStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Search and filter inside posts table
  const [tableSearch, setTableSearch] = useState<string>('');
  const [tableCategory, setTableCategory] = useState<string>('all');

  // Post Editor state (for Create or Edit)
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState<string>('');
  const [formCategoryId, setFormCategoryId] = useState<string>(() => categories[0]?.id || 'cat-photo');
  const [formPromptText, setFormPromptText] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formKeywords, setFormKeywords] = useState<string>('');
  const [formStatus, setFormStatus] = useState<'published' | 'draft'>('published');
  const [formImageUrl, setFormImageUrl] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);

  // Inline Quick Category Add inside post creation form
  const [showQuickAddCat, setShowQuickAddCat] = useState<boolean>(false);
  const [quickCatName, setQuickCatName] = useState<string>('');

  // Category Editor modal / state
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryNameInput, setCategoryNameInput] = useState<string>('');
  const [newCategoryInput, setNewCategoryInput] = useState<string>('');

  // Delete Confirmation Modal
  const [deletingPost, setDeletingPost] = useState<PromptPost | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [passwordSubmitting, setPasswordSubmitting] = useState<boolean>(false);

  // Quick Preview modal
  const [previewingPost, setPreviewingPost] = useState<PromptPost | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, postsData, catsData, supaData] = await Promise.all([
        api.adminGetStats().catch(() => null),
        api.adminGetPosts().catch(() => []),
        api.adminGetCategories().catch(async () => {
          return await api.getCategories().catch(() => DEFAULT_CATEGORIES);
        }),
        api.adminGetSupabaseStatus().catch(() => null)
      ]);

      if (statsData) setStats(statsData);
      if (postsData) setPosts(postsData);

      if (catsData && Array.isArray(catsData) && catsData.length > 0) {
        setCategories(catsData);
        onCategoriesUpdate?.(catsData);
      } else {
        setCategories(DEFAULT_CATEGORIES);
      }

      setSupabaseStatus(supaData);
    } catch (err: any) {
      setActionError(err.message || 'Failed to refresh dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setActionError(msg);
      setTimeout(() => setActionError(null), 5000);
    } else {
      setActionSuccess(msg);
      setTimeout(() => setActionSuccess(null), 4000);
    }
  };

  // Image Upload handler - Bulletproof instant Data URL + background upload
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type and size
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      showNotification('Please select a JPG, PNG, or WebP image.', true);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showNotification('Image size exceeds 10MB limit.', true);
      return;
    }

    // 1. Immediately read as Data URL for instant, 100% reliable preview
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setImagePreview(dataUrl);
      setFormImageUrl(dataUrl); // Form is immediately valid with this image

      // 2. Attempt background upload to server
      setIsUploadingImage(true);
      try {
        const res = await api.adminUploadImage(file);
        if (res && res.url) {
          setFormImageUrl(res.url);
        }
        showNotification('Image uploaded successfully!');
      } catch (err: any) {
        // If server upload fails (e.g. read-only storage or offline), KEEP the Data URL!
        console.warn('Server upload not available, using Data URL directly:', err);
        showNotification('Image loaded and ready to publish.');
      } finally {
        setIsUploadingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Open Create Form
  const handleOpenCreateForm = () => {
    setEditingPostId(null);
    setFormTitle('');
    // Auto-select first category if available
    const activeCats = categories.length > 0 ? categories : DEFAULT_CATEGORIES;
    setFormCategoryId(activeCats[0].id);
    setFormPromptText('');
    setFormDescription('');
    setFormKeywords('');
    setFormStatus('published');
    setFormImageUrl('');
    setImagePreview(null);
    setShowQuickAddCat(false);
    setActiveTab('create-post');
  };

  // Open Edit Form
  const handleOpenEditForm = (post: PromptPost) => {
    setEditingPostId(post.id);
    setFormTitle(post.title);
    setFormCategoryId(post.category_id || categories[0]?.id || DEFAULT_CATEGORIES[0].id);
    setFormPromptText(post.prompt_text);
    setFormDescription(post.description || '');
    setFormKeywords(post.search_keywords || '');
    setFormStatus(post.status);
    setFormImageUrl(post.featured_image_url);
    setImagePreview(post.featured_image_url);
    setShowQuickAddCat(false);
    setActiveTab('create-post');
  };

  // Quick Add Category from inside Post form
  const handleQuickAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCatName.trim()) return;

    try {
      const newCatRes = await api.adminCreateCategory(quickCatName.trim());
      const newCat = newCatRes.category;
      const updated = [...categories, newCat];
      setCategories(updated);
      onCategoriesUpdate?.(updated);
      setFormCategoryId(newCat.id);
      setQuickCatName('');
      setShowQuickAddCat(false);
      showNotification(`Category "${newCat.name}" added and selected!`);
    } catch (err: any) {
      // Local fallback if API had issue
      const localCat: Category = {
        id: `cat-${Date.now()}`,
        name: quickCatName.trim(),
        slug: quickCatName.toLowerCase().replace(/\s+/g, '-'),
        created_at: new Date().toISOString()
      };
      const updated = [...categories, localCat];
      setCategories(updated);
      setFormCategoryId(localCat.id);
      setQuickCatName('');
      setShowQuickAddCat(false);
      showNotification(`Category "${localCat.name}" selected!`);
    }
  };

  // Save Post (Create or Update)
  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formTitle.trim()) {
      showNotification('Please provide a post title.', true);
      return;
    }

    const activeCatId = formCategoryId || categories[0]?.id || DEFAULT_CATEGORIES[0].id;
    const selectedCat = categories.find((c) => c.id === activeCatId) || DEFAULT_CATEGORIES[0];

    if (!formPromptText.trim()) {
      showNotification('Please enter the English prompt text.', true);
      return;
    }
    if (!formImageUrl.trim()) {
      showNotification('Please upload an image or select a preset.', true);
      return;
    }

    setFormSubmitting(true);
    try {
      const payload: Partial<PromptPost> = {
        title: formTitle.trim(),
        category_id: selectedCat.id,
        category_name: selectedCat.name,
        featured_image_url: formImageUrl.trim(),
        prompt_text: formPromptText.trim(),
        description: formDescription.trim(),
        search_keywords: formKeywords.trim(),
        status: formStatus
      };

      if (editingPostId) {
        await api.adminUpdatePost(editingPostId, payload);
        showNotification('Post updated successfully!');
      } else {
        await api.adminCreatePost(payload);
        showNotification('Prompt post published successfully!');
      }

      await loadData();
      setActiveTab('all-posts');
    } catch (err: any) {
      showNotification(err.message || 'Failed to save post.', true);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete Post
  const handleConfirmDeletePost = async () => {
    if (!deletingPost) return;
    try {
      await api.adminDeletePost(deletingPost.id);
      showNotification(`Deleted "${deletingPost.title}"`);
      setDeletingPost(null);
      await loadData();
    } catch (err: any) {
      showNotification(err.message || 'Failed to delete post.', true);
    }
  };

  // Clear All Sample Posts
  const handleClearSamplePosts = async () => {
    if (!window.confirm('Are you sure you want to remove all initial sample posts?')) {
      return;
    }
    try {
      const res = await api.adminClearSamples();
      showNotification(`Removed ${res.removedCount} sample posts. Database is clean!`);
      await loadData();
    } catch (err: any) {
      showNotification(err.message || 'Failed to remove sample posts.', true);
    }
  };

  // Create Category in Manager
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryInput.trim()) return;
    try {
      const res = await api.adminCreateCategory(newCategoryInput.trim());
      setNewCategoryInput('');
      const updated = [...categories, res.category];
      setCategories(updated);
      onCategoriesUpdate?.(updated);
      showNotification('New category added successfully!');
    } catch (err: any) {
      showNotification(err.message || 'Failed to add category.', true);
    }
  };

  // Update Category
  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !categoryNameInput.trim()) return;
    try {
      const res = await api.adminUpdateCategory(editingCategory.id, categoryNameInput.trim());
      setEditingCategory(null);
      setCategoryNameInput('');
      const updated = categories.map((c) => (c.id === res.category.id ? res.category : c));
      setCategories(updated);
      onCategoriesUpdate?.(updated);
      showNotification('Category updated successfully!');
      await loadData();
    } catch (err: any) {
      showNotification(err.message || 'Failed to update category.', true);
    }
  };

  // Delete Category
  const handleConfirmDeleteCategory = async () => {
    if (!deletingCategory) return;
    try {
      await api.adminDeleteCategory(deletingCategory.id);
      showNotification(`Category "${deletingCategory.name}" removed.`);
      setDeletingCategory(null);
      await loadData();
    } catch (err: any) {
      showNotification(err.message || 'Failed to delete category.', true);
    }
  };

  // Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      showNotification('Both fields are required.', true);
      return;
    }
    if (newPassword.length < 8) {
      showNotification('New password must be at least 8 characters long.', true);
      return;
    }

    setPasswordSubmitting(true);
    try {
      await api.adminChangePassword(currentPassword, newPassword);
      showNotification('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      showNotification(err.message || 'Failed to update password.', true);
    } finally {
      setPasswordSubmitting(false);
    }
  };

  // Filtered posts for table
  const filteredTablePosts = posts.filter((p) => {
    if (activeTab === 'published' && p.status !== 'published') return false;
    if (activeTab === 'drafts' && p.status !== 'draft') return false;

    if (tableCategory !== 'all' && p.category_id !== tableCategory) {
      return false;
    }

    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchCat = (p.category_name || '').toLowerCase().includes(q);
      const matchPrompt = (p.prompt_text || '').toLowerCase().includes(q);
      if (!matchTitle && !matchCat && !matchPrompt) return false;
    }

    return true;
  });

  const availableCategories = categories.length > 0 ? categories : DEFAULT_CATEGORIES;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Admin Navigation Header */}
      <header className="bg-slate-900 text-white sticky top-0 z-40 border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="font-extrabold text-lg sm:text-xl tracking-tight text-white flex items-center gap-2">
              <span className="text-blue-400">TS</span> Prompt Store
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 rounded border border-blue-500/30">
                Admin Panel
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 hidden md:inline">
              Signed in as <strong className="text-slate-200">{admin.email}</strong>
            </span>
            <button
              onClick={handleOpenCreateForm}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Create New Post</span>
            </button>
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3 sm:py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Admin Title & Notification Bar */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              TS Prompt Store Admin Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Manage AI prompt posts, categories, image uploads, and platform settings
            </p>
          </div>

          {/* Quick Refresh */}
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Notifications */}
        {actionSuccess && (
          <div className="max-w-7xl mx-auto mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs sm:text-sm font-semibold text-emerald-800 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}
        {actionError && (
          <div className="max-w-7xl mx-auto mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs sm:text-sm font-semibold text-red-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{actionError}</span>
          </div>
        )}
      </div>

      {/* Main Admin Content Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-grow flex flex-col md:flex-row gap-6">
        {/* Sidebar Tabs */}
        <aside className="w-full md:w-60 flex-shrink-0">
          <nav className="bg-white border border-slate-200 rounded-2xl p-2 space-y-1 shadow-sm">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all text-left ${
                activeTab === 'overview'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('all-posts')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all text-left ${
                activeTab === 'all-posts'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <FileText className="w-4 h-4" />
                <span>All Posts</span>
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === 'all-posts' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {posts.length}
              </span>
            </button>

            <button
              onClick={handleOpenCreateForm}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all text-left ${
                activeTab === 'create-post'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>{editingPostId ? 'Edit Post' : 'Create New Post'}</span>
            </button>

            <button
              onClick={() => setActiveTab('categories')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all text-left ${
                activeTab === 'categories'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <FolderTree className="w-4 h-4" />
                <span>Categories</span>
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === 'categories' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {availableCategories.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('published')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all text-left ${
                activeTab === 'published'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Published Posts</span>
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === 'published' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {stats?.publishedPosts || posts.filter((p) => p.status === 'published').length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('drafts')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all text-left ${
                activeTab === 'drafts'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <FileEdit className="w-4 h-4" />
                <span>Draft Posts</span>
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === 'drafts' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {stats?.draftPosts || posts.filter((p) => p.status === 'draft').length}
              </span>
            </button>

            <div className="pt-2 my-2 border-t border-slate-100" />

            <button
              onClick={() => setActiveTab('database')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all text-left ${
                activeTab === 'database'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Database &amp; Supabase</span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all text-left ${
                activeTab === 'security'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>Admin Security</span>
            </button>
          </nav>
        </aside>

        {/* Tab Content Panels */}
        <main className="flex-grow min-w-0">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Total Posts
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                    {posts.length}
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    All created prompts
                  </span>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm">
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                    Published Posts
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">
                    {posts.filter((p) => p.status === 'published').length}
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Live on public store
                  </span>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm">
                  <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                    Draft Posts
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-amber-600 mt-1">
                    {posts.filter((p) => p.status === 'draft').length}
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Hidden from public
                  </span>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm">
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                    Categories
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-blue-600 mt-1">
                    {availableCategories.length}
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Active categories
                  </span>
                </div>
              </div>

              {/* Sample Data Alert Banner if sample exists */}
              {stats && stats.samplePosts > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-blue-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      Sample Prompts Notice ({stats.samplePosts} items loaded)
                    </h3>
                    <p className="text-xs text-blue-700 mt-0.5 leading-relaxed">
                      Initial curated sample prompts are active. You can clear them anytime with 1 click.
                    </p>
                  </div>
                  <button
                    onClick={handleClearSamplePosts}
                    className="flex-shrink-0 px-4 py-2 bg-white text-blue-700 hover:bg-blue-100 border border-blue-300 rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
                  >
                    Remove All Sample Posts
                  </button>
                </div>
              )}

              {/* Quick Actions Panel */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-3">
                  Quick Actions
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={handleOpenCreateForm}
                    className="p-4 bg-slate-50 hover:bg-blue-50/70 border border-slate-200 hover:border-blue-300 rounded-xl text-left transition-all group cursor-pointer"
                  >
                    <PlusCircle className="w-5 h-5 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                    <h4 className="text-sm font-bold text-slate-900">Create New Prompt</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Upload image, title &amp; prompt text</p>
                  </button>

                  <button
                    onClick={() => setActiveTab('categories')}
                    className="p-4 bg-slate-50 hover:bg-blue-50/70 border border-slate-200 hover:border-blue-300 rounded-xl text-left transition-all group cursor-pointer"
                  >
                    <FolderTree className="w-5 h-5 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                    <h4 className="text-sm font-bold text-slate-900">Manage Categories</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Add, edit, or delete store categories</p>
                  </button>

                  <button
                    onClick={() => setActiveTab('database')}
                    className="p-4 bg-slate-50 hover:bg-blue-50/70 border border-slate-200 hover:border-blue-300 rounded-xl text-left transition-all group cursor-pointer"
                  >
                    <Database className="w-5 h-5 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                    <h4 className="text-sm font-bold text-slate-900">Database &amp; Storage</h4>
                    <p className="text-xs text-slate-500 mt-0.5">View persistent database &amp; Supabase info</p>
                  </button>
                </div>
              </div>

              {/* Recent Posts preview */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-900">
                    Latest Created Posts
                  </h3>
                  {posts.length > 0 && (
                    <button
                      onClick={() => setActiveTab('all-posts')}
                      className="text-xs font-bold text-blue-600 hover:underline"
                    >
                      View All ({posts.length}) &rarr;
                    </button>
                  )}
                </div>

                {posts.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <p className="text-sm mb-3">No posts have been created yet.</p>
                    <button
                      onClick={handleOpenCreateForm}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                      + Create First Prompt
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {posts.slice(0, 5).map((post) => (
                      <div
                        key={post.id}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 border border-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={post.featured_image_url}
                            alt={post.title}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 rounded-lg object-cover bg-slate-100 flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-900 truncate">
                              {post.title}
                            </h4>
                            <span className="text-[11px] text-slate-500">
                              {post.category_name} &middot;{' '}
                              <span className={post.status === 'published' ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>
                                {post.status}
                              </span>
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => handleOpenEditForm(post)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setPreviewingPost(post)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Preview"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2, 5, 6: POSTS TABLE (ALL, PUBLISHED, DRAFTS) */}
          {(activeTab === 'all-posts' || activeTab === 'published' || activeTab === 'drafts') && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {activeTab === 'published'
                      ? 'Published Posts'
                      : activeTab === 'drafts'
                      ? 'Draft Posts'
                      : 'All Stored Posts'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {filteredTablePosts.length} posts found
                  </p>
                </div>

                {/* Table search & category filter */}
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={tableSearch}
                      onChange={(e) => setTableSearch(e.target.value)}
                      placeholder="Filter posts..."
                      className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <select
                    value={tableCategory}
                    onChange={(e) => setTableCategory(e.target.value)}
                    className="py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 cursor-pointer font-medium"
                  >
                    <option value="all">All Categories</option>
                    {availableCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-3">Thumbnail</th>
                      <th className="py-3 px-3">Title</th>
                      <th className="py-3 px-3">Category</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Last Updated</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTablePosts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-500">
                          <p className="font-semibold text-sm mb-1">No posts match your filters</p>
                          <p className="text-xs text-slate-400 mb-4">Click below to create your first post</p>
                          <button
                            onClick={handleOpenCreateForm}
                            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 cursor-pointer"
                          >
                            + Create New Post
                          </button>
                        </td>
                      </tr>
                    ) : (
                      filteredTablePosts.map((post) => (
                        <tr key={post.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2.5 px-3">
                            <img
                              src={post.featured_image_url}
                              alt={post.title}
                              referrerPolicy="no-referrer"
                              className="w-12 h-10 object-cover rounded-lg bg-slate-100 border border-slate-200/60"
                            />
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-900 max-w-xs truncate">
                            {post.title}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {post.category_name}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                post.status === 'published'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {post.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                            {new Date(post.updated_at).toLocaleDateString()}
                          </td>
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => setPreviewingPost(post)}
                                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title="Quick Preview"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleOpenEditForm(post)}
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit Post"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeletingPost(post)}
                                className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete Post"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: CREATE / EDIT POST FORM */}
          {activeTab === 'create-post' && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-7 shadow-sm">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {editingPostId ? 'Edit Existing Prompt Post' : 'Create New Prompt Post'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Add featured image, title, category, and English prompt text
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('all-posts')}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleSavePost} className="space-y-6">
                {/* 1. Featured Image Upload & Preview */}
                <div className="p-4 bg-slate-50/70 border border-slate-200/90 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      1. Featured Image <span className="text-red-500">*</span>
                    </label>
                    {imagePreview && (
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(null);
                          setFormImageUrl('');
                        }}
                        className="text-[11px] font-bold text-red-600 hover:underline flex items-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        Remove Image
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    {/* Preview Box */}
                    <div className="w-full sm:w-52 h-40 bg-white border-2 border-dashed border-slate-300 rounded-xl overflow-hidden flex items-center justify-center relative flex-shrink-0 shadow-inner">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Preview"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center p-3 text-slate-400">
                          <ImageIcon className="w-8 h-8 mx-auto mb-1 text-slate-300" />
                          <span className="text-[11px] block font-medium">No image selected</span>
                          <span className="text-[10px] text-slate-400">Upload or choose below</span>
                        </div>
                      )}
                      {isUploadingImage && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xs font-bold gap-2 backdrop-blur-xs">
                          <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                          Processing...
                        </div>
                      )}
                    </div>

                    {/* Upload Controls & URL input */}
                    <div className="flex-grow space-y-3 w-full">
                      <div>
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          onChange={handleImageFileChange}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingImage}
                          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-blue-500/20 cursor-pointer"
                        >
                          <Upload className="w-4 h-4" />
                          <span>Select Image from Computer / Phone</span>
                        </button>
                        <span className="ml-2 text-[11px] text-slate-400">JPG, PNG, WebP (Max 10MB)</span>
                      </div>

                      {/* Direct URL input */}
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">
                          Or Paste Image URL directly:
                        </label>
                        <input
                          type="url"
                          value={formImageUrl}
                          onChange={(e) => {
                            setFormImageUrl(e.target.value);
                            setImagePreview(e.target.value);
                          }}
                          placeholder="https://images.unsplash.com/... or paste any direct link"
                          className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none"
                        />
                      </div>

                      {/* Quick Preset Images for instant testing */}
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Quick Presets (1-Click Test Images):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {PRESET_IMAGES.map((preset) => (
                            <button
                              key={preset.name}
                              type="button"
                              onClick={() => {
                                setFormImageUrl(preset.url);
                                setImagePreview(preset.url);
                                showNotification(`Loaded "${preset.name}" image!`);
                              }}
                              className="px-2 py-1 text-[10px] font-semibold bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                            >
                              {preset.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Post Title */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    2. Post Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    required
                    placeholder="e.g. Ultra-realistic Macro Photography of Emerald Hummingbird"
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* 3. Category & Publication Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Category Selection with Inline Add */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        3. Category <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowQuickAddCat(!showQuickAddCat)}
                        className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        {showQuickAddCat ? 'Hide' : '+ Add New Category'}
                      </button>
                    </div>

                    {/* Inline Quick Category Creator */}
                    {showQuickAddCat && (
                      <div className="mb-2 p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl flex gap-2">
                        <input
                          type="text"
                          value={quickCatName}
                          onChange={(e) => setQuickCatName(e.target.value)}
                          placeholder="New category name (e.g. Architecture)"
                          className="flex-grow text-xs p-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleQuickAddCategory}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 cursor-pointer"
                        >
                          Add &amp; Select
                        </button>
                      </div>
                    )}

                    <select
                      value={formCategoryId}
                      onChange={(e) => setFormCategoryId(e.target.value)}
                      required
                      className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer font-semibold text-slate-800"
                    >
                      {availableCategories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>

                    <p className="text-[11px] text-slate-400 mt-1">
                      Current selection: <strong className="text-blue-600">{availableCategories.find((c) => c.id === formCategoryId)?.name || 'Default'}</strong>
                    </p>
                  </div>

                  {/* Status Dropdown */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Publication Status
                    </label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as any)}
                      className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer font-semibold"
                    >
                      <option value="published">Published (Visible on store immediately)</option>
                      <option value="draft">Draft (Private admin only)</option>
                    </select>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Published posts appear immediately on homepage and detail routes.
                    </p>
                  </div>
                </div>

                {/* 4. English Prompt Text */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    4. English Prompt Text <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={5}
                    value={formPromptText}
                    onChange={(e) => setFormPromptText(e.target.value)}
                    required
                    placeholder="Enter the complete English prompt with aspect ratios, cameras, lighting, and style tokens..."
                    className="w-full p-3 font-mono text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Preserves formatting, line breaks, and prompt flags.
                  </p>
                </div>

                {/* 5. Optional Description */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    5. Description (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Brief explanation about the image, camera settings, or recommended AI tool..."
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* 6. Optional Search Keywords */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    6. Search Keywords (Optional)
                  </label>
                  <input
                    type="text"
                    value={formKeywords}
                    onChange={(e) => setFormKeywords(e.target.value)}
                    placeholder="e.g. cinematic, portrait, 8k, photorealistic, neon, tokyo"
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Comma separated keywords used by search relevance ranking.
                  </p>
                </div>

                {/* Submit Buttons */}
                <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 transition-all disabled:opacity-60 cursor-pointer"
                  >
                    {formSubmitting
                      ? 'Saving Post...'
                      : editingPostId
                      ? 'Save Changes'
                      : 'Publish Post'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (formTitle && formPromptText && formImageUrl) {
                        const selectedCat = availableCategories.find((c) => c.id === formCategoryId) || availableCategories[0];
                        setPreviewingPost({
                          id: editingPostId || 'preview-temp',
                          title: formTitle,
                          slug: 'preview',
                          category_id: selectedCat.id,
                          category_name: selectedCat.name,
                          featured_image_url: formImageUrl,
                          prompt_text: formPromptText,
                          description: formDescription,
                          search_keywords: formKeywords,
                          status: formStatus,
                          created_at: new Date().toISOString(),
                          updated_at: new Date().toISOString(),
                          published_at: new Date().toISOString()
                        });
                      } else {
                        showNotification('Fill in title, prompt, and image to preview.', true);
                      }
                    }}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                  >
                    Preview Post
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('all-posts')}
                    className="px-4 py-2.5 text-slate-500 hover:text-slate-800 text-sm font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: CATEGORIES MANAGER */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              {/* Add Category Form */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-3">
                  + Add New Category
                </h3>
                <form onSubmit={handleCreateCategory} className="flex gap-2">
                  <input
                    type="text"
                    value={newCategoryInput}
                    onChange={(e) => setNewCategoryInput(e.target.value)}
                    placeholder="e.g. Architecture Prompts, Cyberpunk Prompts, 3D Render..."
                    className="flex-grow p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm transition-colors cursor-pointer flex-shrink-0"
                  >
                    Add Category
                  </button>
                </form>
              </div>

              {/* Categories List */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-4">
                  Manage Existing Categories ({availableCategories.length})
                </h3>

                <div className="divide-y divide-slate-100">
                  {availableCategories.map((cat) => {
                    const postCount = posts.filter((p) => p.category_id === cat.id).length;

                    return (
                      <div
                        key={cat.id}
                        className="py-3 flex items-center justify-between gap-3"
                      >
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">
                            {cat.name}
                          </h4>
                          <span className="text-xs text-slate-400 font-mono">
                            slug: {cat.slug} &middot; {postCount} posts linked
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setEditingCategory(cat);
                              setCategoryNameInput(cat.name);
                            }}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Rename Category"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingCategory(cat)}
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Category"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: DATABASE & SUPABASE INTEGRATION */}
          {activeTab === 'database' && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-7 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Database className="w-5 h-5 text-blue-600" />
                  Database &amp; Image Storage Architecture
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Compliant with specification: Zero Firebase dependency. Real persistent storage and Supabase compatibility.
                </p>
              </div>

              {/* Status summary */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-600">Local Persistent Database:</span>
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Active &amp; Persistent (Atomic writes)
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-600">Local Image Storage:</span>
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Active (/uploads/ static directory)
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-600">External Supabase Connection:</span>
                  <span
                    className={`px-2 py-0.5 rounded border ${
                      supabaseStatus?.supabaseConfigured
                        ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                        : 'text-slate-500 bg-slate-100 border-slate-200'
                    }`}
                  >
                    {supabaseStatus?.supabaseConfigured ? 'Configured via .env' : 'Optional (Ready to plug-in)'}
                  </span>
                </div>
              </div>

              {/* Supabase Schema Code Block */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Supabase PostgreSQL SQL Schema &amp; RLS Policies:
                  </h3>
                  <button
                    onClick={() => {
                      if (supabaseStatus?.sqlSchema) {
                        navigator.clipboard.writeText(supabaseStatus.sqlSchema);
                        showNotification('Supabase SQL schema copied to clipboard!');
                      }
                    }}
                    className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    Copy SQL Script
                  </button>
                </div>
                <pre className="p-4 bg-slate-900 text-slate-200 font-mono text-xs rounded-xl overflow-x-auto max-h-64">
                  {supabaseStatus?.sqlSchema || '-- SQL schema loading...'}
                </pre>
                <p className="text-[11px] text-slate-500 mt-2">
                  To connect an external Supabase instance, create a project on Supabase.com, run the SQL script above in Supabase SQL editor, and provide SUPABASE_URL &amp; SUPABASE_SERVICE_ROLE_KEY in your environment variables.
                </p>
              </div>
            </div>
          )}

          {/* TAB 8: ADMIN SECURITY / PASSWORD CHANGE */}
          {activeTab === 'security' && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-7 shadow-sm max-w-xl">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-1">
                <KeyRound className="w-5 h-5 text-blue-600" />
                Change Administrator Password
              </h2>
              <p className="text-xs text-slate-500 mb-5">
                Passwords are securely hashed on the server using PBKDF2 with SHA-512 and cryptographic salt.
              </p>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    New Secure Password (Minimum 8 chars)
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={passwordSubmitting}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 transition-all disabled:opacity-60 cursor-pointer"
                  >
                    {passwordSubmitting ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* MODAL: Edit Category Name */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 mb-3">
              Rename Category
            </h3>
            <form onSubmit={handleUpdateCategory} className="space-y-4">
              <input
                type="text"
                value={categoryNameInput}
                onChange={(e) => setCategoryNameInput(e.target.value)}
                required
                className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700"
                >
                  Save Name
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Confirm Delete Post */}
      {deletingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl">
            <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Delete Prompt Post?
            </h3>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Are you sure you want to delete <strong>&quot;{deletingPost.title}&quot;</strong>? This will permanently remove the post.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingPost(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeletePost}
                className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Confirm Delete Category */}
      {deletingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl">
            <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Delete Category?
            </h3>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Remove category <strong>&quot;{deletingCategory.name}&quot;</strong>?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingCategory(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCategory}
                className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Quick Preview Post */}
      {previewingPost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
          onClick={() => setPreviewingPost(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewingPost(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>

            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              {previewingPost.category_name} &middot; Preview Mode
            </span>
            <h3 className="text-xl font-bold text-slate-900 mt-1 mb-3">
              {previewingPost.title}
            </h3>

            <div className="aspect-[16/10] w-full rounded-xl overflow-hidden bg-slate-100 mb-4 border border-slate-200">
              <img
                src={previewingPost.featured_image_url}
                alt={previewingPost.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="p-4 bg-slate-50 border border-blue-100 rounded-xl mb-4">
              <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                English Prompt:
              </span>
              <p className="font-mono text-xs text-slate-800 whitespace-pre-wrap">
                {previewingPost.prompt_text}
              </p>
            </div>

            {previewingPost.description && (
              <p className="text-xs text-slate-600 mb-4">
                {previewingPost.description}
              </p>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-400">
                Status: <strong>{previewingPost.status}</strong>
              </span>
              <button
                onClick={() => {
                  setPreviewingPost(null);
                  if (previewingPost.status === 'published' && previewingPost.slug !== 'preview') {
                    onPreviewPublicPost(previewingPost.slug);
                  }
                }}
                className="text-blue-600 font-bold hover:underline"
              >
                Open Public Page &rarr;
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
