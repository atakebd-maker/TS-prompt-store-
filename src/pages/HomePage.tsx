import React, { useEffect, useState, useMemo } from 'react';
import { PromptPost, Category } from '../types.ts';
import { api } from '../api/client.ts';
import { PromptGrid } from '../components/PromptGrid.tsx';
import { Sparkles, Layers, SlidersHorizontal, ArrowUpDown } from 'lucide-react';

interface HomePageProps {
  categories: Category[];
  selectedCategory: string;
  searchQuery: string;
  onSelectCategory: (slug: string) => void;
  onOpenPost: (post: PromptPost) => void;
  onResetSearch: () => void;
  savedPostIds?: string[];
  onToggleSave?: (post: PromptPost, e: React.MouseEvent) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  categories,
  selectedCategory,
  searchQuery,
  onSelectCategory,
  onOpenPost,
  onResetSearch,
  savedPostIds = [],
  onToggleSave
}) => {
  const [posts, setPosts] = useState<PromptPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'relevant' | 'newest' | 'title'>('relevant');

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);

    api
      .getPosts(selectedCategory, searchQuery)
      .then((data) => {
        if (!isCancelled) {
          setPosts(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error('Failed to load posts:', err);
          setError(err.message || 'Unable to load prompt store posts.');
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [selectedCategory, searchQuery]);

  // Client-side sort options (Newest vs Relevance vs Alphabetical)
  const sortedPosts = useMemo(() => {
    const list = [...posts];
    if (sortBy === 'newest') {
      return list.sort(
        (a, b) =>
          new Date(b.published_at || b.created_at).getTime() -
          new Date(a.published_at || a.created_at).getTime()
      );
    }
    if (sortBy === 'title') {
      return list.sort((a, b) => a.title.localeCompare(b.title));
    }
    // 'relevant' keeps the server's relevance score order
    return list;
  }, [posts, sortBy]);

  // Active category display name
  const currentCategoryName = useMemo(() => {
    if (selectedCategory === 'all') return 'All Prompts';
    const cat = categories.find(
      (c) => c.slug === selectedCategory || c.id === selectedCategory
    );
    return cat ? cat.name : 'Prompts';
  }, [categories, selectedCategory]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
      {/* Feed Sub-Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 sm:mb-7">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {searchQuery ? `Search Results for "${searchQuery}"` : currentCategoryName}
            </h1>
            {!loading && (
              <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-100">
                {posts.length} {posts.length === 1 ? 'Prompt' : 'Prompts'}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {searchQuery
              ? 'Ranked by title, keyword, and content relevance'
              : 'Browse high-quality prompts and copy with one click'}
          </p>
        </div>

        {/* Sort Filter Control */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center text-xs font-semibold text-slate-500 gap-1.5 bg-slate-50 border border-slate-200/80 rounded-lg px-2.5 py-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="relevant">Relevance</option>
              <option value="newest">Newest First</option>
              <option value="title">Alphabetical (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {error ? (
        <div className="p-6 text-center bg-red-50 border border-red-200 rounded-2xl max-w-md mx-auto">
          <p className="text-sm font-semibold text-red-700">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-colors"
          >
            Retry Loading
          </button>
        </div>
      ) : (
        <PromptGrid
          posts={sortedPosts}
          loading={loading}
          searchQuery={searchQuery}
          onOpenPost={onOpenPost}
          onResetSearch={onResetSearch}
          savedPostIds={savedPostIds}
          onToggleSave={onToggleSave}
        />
      )}
    </div>
  );
};
