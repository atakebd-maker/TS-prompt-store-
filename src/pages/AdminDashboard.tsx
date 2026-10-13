import React, { useEffect, useState } from 'react';
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
  Plus,
  Link2,
  Camera,
  Film,
  User,
  Palette,
  Sparkle
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

const PRESET_IMAGE_LINKS = [
  {
    name: 'Cyberpunk Ronin (Cinematic)',
    url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80'
  },
  {
    name: 'Studio Portrait (Portrait)',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80'
  },
  {
    name: 'Macro Butterfly (Photo)',
    url: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=1200&q=80'
  },
  {
    name: 'Anime Woodland (Anime)',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80'
  },
  {
    name: 'Megacity Drone (Video)',
    url: 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?auto=format&fit=crop&w=1200&q=80'
  },
  {
    name: 'Classic Vintage Muscle (Photo)',
    url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80'
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

  // Post Editor state (Direct Link & Category)
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState<string>('');
  const [formCategoryId, setFormCategoryId] = useState<string>(() => categories[0]?.id || 'cat-photo');
  const [formPromptText, setFormPromptText] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formKeywords, setFormKeywords] = useState<string>('');
  const [formStatus, setFormStatus] = useState<'published' | 'draft'>('published');
  const [formImageUrl, setFormImageUrl] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
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

  // Open Create Form
  const handleOpenCreateForm = (catId?: string) => {
    setEditingPostId(null);
    setFormTitle('');
    const activeCats = categories.length > 0 ? categories : DEFAULT_CATEGORIES;
    setFormCategoryId(catId || activeCats[0].id);
    setFormPromptText('');
    setFormDescription('');
    setFormKeywords('');
    setFormStatus('published');
    setFormImageUrl('');
    setImagePreview(null);
    setShowQuickAddCat(false);
    setActiveTab('create-post');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    } catch {
      // Local fallback
      const localCat: Category = {
        id: `cat-${Date.now()}`,
        name: quickCatName.trim(),
        slug: quickCatName.toLowerCase().replace(/\s+/g, '-'),
        created_at: new Date().toISOString()
      };
      const updated = [...categories, localCat];
      setCategories(updated);
      onCategoriesUpdate?.(updated);
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

    if (!formImageUrl.trim()) {
      showNotification('Please paste an Image Link / URL.', true);
      return;
    }

    if (!formPromptText.trim()) {
      showNotification('Please enter the English prompt text.', true);
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
      showNotification(`Removed ${res.removedCount} sample posts.`);
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
              Admin: <strong className="text-slate-200">{admin.email}</strong>
            </span>
            <button
              onClick={() => handleOpenCreateForm()}
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
              Manage all AI prompt posts, categories, image links, and platform configurations
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
              onClick={() => handleOpenCreateForm()}
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
                {posts.filter((p) => p.status === 'published').length}
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
                {posts.filter((p) => p.status === 'draft').length}
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
              <span>Database Info</span>
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
                    All stored prompts
                  </span>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm">
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                    Published
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">
                    {posts.filter((p) => p.status === 'published').length}
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Live on store
                  </span>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm">
                  <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                    Drafts
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
                    Ready for posts
                  </span>
                </div>
              </div>

              {/* Store Categories Panel in Overview */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <FolderTree className="w-4 h-4 text-blue-600" />
                      Active Store Categories ({availableCategories.length})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Click any category below to immediately create a post inside it:
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('categories')}
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    Manage All &rarr;
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 pt-1">
                  {availableCategories.map((cat) => {
                    const postCount = posts.filter((p) => p.category_id === cat.id).length;
                    return (
                      <div
                        key={cat.id}
                        onClick={() => handleOpenCreateForm(cat.id)}
                        className="group p-3 bg-slate-50 hover:bg-blue-50/80 border border-slate-200 hover:border-blue-300 rounded-xl transition-all cursor-pointer flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs text-slate-900 group-hover:text-blue-700">
                            {cat.name}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>{postCount} posts</span>
                          <span className="text-blue-600 font-bold group-hover:underline text-[10px]">+ Post</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sample Data Alert Banner if sample exists */}
              {stats && stats.samplePosts > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-blue-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      Sample Prompts Loaded ({stats.samplePosts} items)
                    </h3>
                    <p className="text-xs text-blue-700 mt-0.5 leading-relaxed">
                      You can remove all sample posts with 1 click to keep only your own content.
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
                      onClick={() => handleOpenCreateForm()}
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
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setPreviewingPost(post)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
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
                            onClick={() => handleOpenCreateForm()}
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
                          <td className="py-2.5 px-3 text-slate-600 font-medium">
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

          {/* TAB 3: CREATE / EDIT POST FORM (DIRECT IMAGE LINK & INTERACTIVE CATEGORIES) */}
          {activeTab === 'create-post' && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-7 shadow-sm">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {editingPostId ? 'Edit Existing Prompt Post' : 'Create New Prompt Post'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Fast &amp; reliable post creation via direct Image URL and category selection
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('all-posts')}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleSavePost} className="space-y-6">
                {/* 1. Featured Image via Direct Link (No file upload required) */}
                <div className="p-4 sm:p-5 bg-blue-50/40 border border-blue-200/80 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <Link2 className="w-4 h-4 text-blue-600" />
                      1. Featured Image Link / URL <span className="text-red-500">*</span>
                    </label>
                    {imagePreview && (
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(null);
                          setFormImageUrl('');
                        }}
                        className="text-[11px] font-bold text-red-600 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                        Clear Link
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    {/* Live Image Preview Box */}
                    <div className="w-full sm:w-64 h-44 bg-white border-2 border-dashed border-blue-200 rounded-xl overflow-hidden flex items-center justify-center relative flex-shrink-0 shadow-xs">
                      {imagePreview ? (
                        <div className="relative w-full h-full group">
                          <img
                            src={imagePreview}
                            alt="Live Preview"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                            onError={() => {
                              showNotification('Image link is not loading properly. Please check the URL.', true);
                            }}
                          />
                          <div className="absolute bottom-1.5 left-1.5 right-1.5 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded font-medium truncate flex items-center justify-between">
                            <span>Image Link Active</span>
                            <Check className="w-3 h-3 text-emerald-400" />
                          </div>
                        </div>
                      ) : (
                        <div className="text-center p-3 text-slate-400">
                          <ImageIcon className="w-8 h-8 mx-auto mb-1 text-blue-300" />
                          <span className="text-xs font-bold text-slate-600 block">No Image Link</span>
                          <span className="text-[10px] text-slate-400">Paste image URL on the right</span>
                        </div>
                      )}
                    </div>

                    {/* URL Input & Quick Tools */}
                    <div className="flex-grow space-y-3 w-full">
                      <div className="relative">
                        <input
                          type="url"
                          value={formImageUrl}
                          onChange={(e) => {
                            const val = e.target.value.trim();
                            setFormImageUrl(val);
                            setImagePreview(val || null);
                          }}
                          placeholder="Paste image link (e.g. https://images.unsplash.com/... or https://i.imgur.com/...)"
                          className="w-full text-xs sm:text-sm pl-3 pr-24 py-2.5 bg-white border border-slate-300 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all font-mono"
                        />
                        {typeof navigator !== 'undefined' && navigator.clipboard && (
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const text = await navigator.clipboard.readText();
                                if (text && (text.startsWith('http://') || text.startsWith('https://') || text.startsWith('data:image'))) {
                                  setFormImageUrl(text);
                                  setImagePreview(text);
                                  showNotification('Image link pasted from clipboard!');
                                } else {
                                  showNotification('Clipboard does not contain a valid web link.', true);
                                }
                              } catch {
                                showNotification('Unable to read clipboard automatically. Please press Ctrl+V to paste.', true);
                              }
                            }}
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 text-xs font-bold bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg transition-colors cursor-pointer border border-slate-200"
                          >
                            Paste Link
                          </button>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 leading-normal">
                        Using direct links makes the website load ultra-fast without server upload limits. Works with any public image URL (Unsplash, Imgur, Postimages, Discord, Cloudinary, etc.).
                      </p>

                      {/* 1-Click Preset Samples */}
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Or Click a Sample Image to Test Instantly:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {PRESET_IMAGE_LINKS.map((preset) => (
                            <button
                              key={preset.name}
                              type="button"
                              onClick={() => {
                                setFormImageUrl(preset.url);
                                setImagePreview(preset.url);
                                showNotification(`Selected "${preset.name}" link!`);
                              }}
                              className="px-2.5 py-1 text-[10px] sm:text-[11px] font-semibold bg-white hover:bg-blue-600 hover:text-white text-slate-700 border border-slate-200 rounded-lg transition-all cursor-pointer shadow-2xs"
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

                {/* 3. Category Selection (Visual Grid & Dropdown) */}
                <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <FolderTree className="w-4 h-4 text-blue-600" />
                      3. Select Category <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowQuickAddCat(!showQuickAddCat)}
                      className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      {showQuickAddCat ? 'Hide' : '+ Add New Category'}
                    </button>
                  </div>

                  {/* Inline Quick Category Creator */}
                  {showQuickAddCat && (
                    <div className="mb-3 p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl flex gap-2">
                      <input
                        type="text"
                        value={quickCatName}
                        onChange={(e) => setQuickCatName(e.target.value)}
                        placeholder="New category name (e.g. Architecture Prompts)"
                        className="flex-grow text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleQuickAddCategory}
                        className="px-3.5 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 cursor-pointer"
                      >
                        Add &amp; Select
                      </button>
                    </div>
                  )}

                  {/* Interactive Category Buttons Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-3">
                    {availableCategories.map((c) => {
                      const isSelected = formCategoryId === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setFormCategoryId(c.id)}
                          className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition-all text-left cursor-pointer ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20'
                              : 'bg-white hover:bg-blue-50 text-slate-700 border-slate-200 hover:border-blue-300'
                          }`}
                        >
                          <span className="truncate">{c.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0 ml-1" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Fallback Dropdown */}
                  <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-200/60">
                    <span className="text-xs font-medium text-slate-500">
                      Selected Category: <strong className="text-blue-600">{availableCategories.find((c) => c.id === formCategoryId)?.name}</strong>
                    </span>

                    <select
                      value={formCategoryId}
                      onChange={(e) => setFormCategoryId(e.target.value)}
                      required
                      className="text-xs p-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none cursor-pointer font-semibold text-slate-700"
                    >
                      {availableCategories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 4. Publication Status */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    4. Publication Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full sm:w-80 p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer font-semibold"
                  >
                    <option value="published">Published (Visible immediately on website)</option>
                    <option value="draft">Draft (Private admin only)</option>
                  </select>
                </div>

                {/* 5. English Prompt Text */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    5. English Prompt Text <span className="text-red-500">*</span>
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
                    Preserves formatting, line breaks, and prompt flags. Visitors will copy this text with 1 click.
                  </p>
                </div>

                {/* 6. Optional Description */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    6. Description (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Brief explanation about what this prompt generates..."
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* 7. Optional Search Keywords */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    7. Search Keywords (Optional)
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
                        showNotification('Fill in title, prompt, and image link to preview.', true);
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
                <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-blue-600" />
                  Add New Category
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
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <FolderTree className="w-4 h-4 text-blue-600" />
                  Store Categories List ({availableCategories.length})
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {availableCategories.map((cat) => {
                    const postCount = posts.filter((p) => p.category_id === cat.id).length;

                    return (
                      <div
                        key={cat.id}
                        className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-xl flex items-center justify-between gap-3"
                      >
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">
                            {cat.name}
                          </h4>
                          <span className="text-xs text-slate-400 font-mono">
                            {postCount} posts linked
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenCreateForm(cat.id)}
                            className="px-2 py-1 text-[11px] font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer border border-blue-200"
                            title="Create post in this category"
                          >
                            + Post
                          </button>
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

          {/* TAB 7: DATABASE & STORAGE INFORMATION */}
          {activeTab === 'database' && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-7 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Database className="w-5 h-5 text-blue-600" />
                  Database &amp; Direct Image Link Architecture
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Optimized for fast performance, zero storage bloat, and seamless Vercel hosting.
                </p>
              </div>

              {/* Status summary */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-600">Image Strategy:</span>
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Direct Image URLs / CDN Links (Ultra fast &amp; free)
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-600">Local Persistent Database:</span>
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Active (data/db.json with atomic writes)
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
                    {supabaseStatus?.supabaseConfigured ? 'Connected' : 'Optional (Ready to plug-in)'}
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
                    className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    Copy SQL Script
                  </button>
                </div>
                <pre className="p-4 bg-slate-900 text-slate-200 font-mono text-xs rounded-xl overflow-x-auto max-h-64">
                  {supabaseStatus?.sqlSchema || '-- SQL schema loading...'}
                </pre>
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
                Passwords are salt-hashed on the server using PBKDF2 with SHA-512.
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
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 cursor-pointer"
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
              Are you sure you want to delete <strong>&quot;{deletingPost.title}&quot;</strong>?
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
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 cursor-pointer"
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
                className="text-blue-600 font-bold hover:underline cursor-pointer"
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
