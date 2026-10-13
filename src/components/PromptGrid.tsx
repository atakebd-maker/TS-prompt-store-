import React, { useState } from 'react';
import { PromptPost } from '../types.ts';
import { PromptCard } from './PromptCard.tsx';
import { SearchX, Sparkles } from 'lucide-react';

interface PromptGridProps {
  posts: PromptPost[];
  loading: boolean;
  searchQuery: string;
  onOpenPost: (post: PromptPost) => void;
  onResetSearch?: () => void;
  savedPostIds?: string[];
  onToggleSave?: (post: PromptPost, e: React.MouseEvent) => void;
}

export const PromptGrid: React.FC<PromptGridProps> = ({
  posts,
  loading,
  searchQuery,
  onOpenPost,
  onResetSearch,
  savedPostIds = [],
  onToggleSave
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleQuickCopy = async (promptText: string, e: React.MouseEvent, postId: string) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(promptText);
      setCopiedId(postId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-5">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div
            key={idx}
            className="animate-pulse bg-white border border-slate-100 rounded-xl sm:rounded-2xl overflow-hidden"
          >
            <div className="aspect-[4/3] bg-slate-200" />
            <div className="p-3 sm:p-4 space-y-2">
              <div className="h-3 bg-slate-200 rounded w-1/3" />
              <div className="h-4 bg-slate-200 rounded w-5/6" />
              <div className="h-4 bg-slate-200 rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-16 px-4 max-w-md mx-auto">
        <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100">
          <SearchX className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">
          কোন প্রম্পট পাওয়া যায়নি
        </h3>
        <p className="text-sm text-slate-500 mb-5 leading-relaxed">
          {searchQuery
            ? `"${searchQuery}" এর সাথে মিলে এমন কোন প্রম্পট পাওয়া যায়নি। অন্যান্য কি-ওয়ার্ড বা ক্যাটাগরি ট্রাই করুন।`
            : 'ওয়েবসাইটে এখনো কোন প্রম্পট পাবলিশ করা হয়নি। এডমিন প্যানেল থেকে পোস্ট যোগ করলে তা এখানে দেখতে পাবেন।'}
        </p>
        {onResetSearch && (
          <button
            onClick={onResetSearch}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            সকল প্রম্পট দেখুন
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-5">
      {posts.map((post) => (
        <PromptCard
          key={post.id}
          post={post}
          onOpen={onOpenPost}
          onQuickCopy={(prompt, e) => handleQuickCopy(prompt, e, post.id)}
          isCopied={copiedId === post.id}
          isSaved={savedPostIds.includes(post.id)}
          onToggleSave={onToggleSave}
        />
      ))}
    </div>
  );
};
