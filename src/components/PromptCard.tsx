import React from 'react';
import { PromptPost } from '../types.ts';
import { ArrowUpRight, Copy, Check, Bookmark } from 'lucide-react';

interface PromptCardProps {
  post: PromptPost;
  onOpen: (post: PromptPost) => void;
  onQuickCopy?: (prompt: string, e: React.MouseEvent) => void;
  isCopied?: boolean;
  isSaved?: boolean;
  onToggleSave?: (post: PromptPost, e: React.MouseEvent) => void;
}

export const PromptCard: React.FC<PromptCardProps> = ({
  post,
  onOpen,
  onQuickCopy,
  isCopied,
  isSaved,
  onToggleSave
}) => {
  const formattedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    : null;

  return (
    <article
      onClick={() => onOpen(post)}
      className="group relative flex flex-col bg-white border border-slate-200/80 rounded-xl sm:rounded-2xl overflow-hidden hover:border-blue-400/80 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 cursor-pointer text-left"
    >
      {/* Featured Image Container */}
      <div className="relative aspect-[4/3] w-full bg-slate-100 overflow-hidden">
        <img
          src={post.featured_image_url}
          alt={post.title}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          onError={(e) => {
            const img = e.target as HTMLImageElement;
            const fallback =
              'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22400%22%20height%3D%22300%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%232563eb%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20fill%3D%22%23ffffff%22%20font-size%3D%2218%22%20font-family%3D%22sans-serif%22%20text-anchor%3D%22middle%22%20dy%3D%22.3em%22%3ETS%20Prompt%20Image%3C%2Ftext%3E%3C%2Fsvg%3E';
            if (img.src !== fallback) {
              img.src = fallback;
            }
          }}
        />

        {/* Action Badges in top-right */}
        <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
          {onToggleSave && (
            <button
              type="button"
              onClick={(e) => onToggleSave(post, e)}
              className={`p-1.5 sm:p-2 backdrop-blur-md rounded-lg shadow-sm transition-all ${
                isSaved
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/90 text-slate-700 hover:text-blue-600 hover:bg-white'
              }`}
              title={isSaved ? 'সংরক্ষিত থেকে সরান' : 'প্রম্পট সংরক্ষণ করুন'}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
            </button>
          )}

          {onQuickCopy && (
            <button
              type="button"
              onClick={(e) => onQuickCopy(post.prompt_text, e)}
              className="p-1.5 sm:p-2 bg-white/90 backdrop-blur-md rounded-lg text-slate-700 hover:text-blue-600 hover:bg-white shadow-sm transition-all"
              title="প্রম্পট দ্রুত কপি করুন"
            >
              {isCopied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          )}

          <div className="p-1.5 sm:p-2 bg-white/90 backdrop-blur-md rounded-lg text-slate-700 group-hover:text-blue-600 group-hover:bg-white shadow-sm transition-all">
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </div>

        {/* Video / Photo Prompt Subtle Tag */}
        {post.category_name && post.category_name.toLowerCase().includes('video') && (
          <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-semibold rounded-md tracking-wider uppercase">
            Video
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-2.5 sm:p-4 flex flex-col flex-grow justify-between gap-1.5 sm:gap-2">
        {/* Category & Date */}
        <div className="flex items-center justify-between text-[11px] sm:text-xs">
          <span className="font-semibold text-blue-600 hover:text-blue-700 truncate pr-1">
            {post.category_name}
          </span>
          {formattedDate && (
            <span className="text-slate-400 font-medium whitespace-nowrap text-[10px] sm:text-[11px]">
              {formattedDate}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
          {post.title}
        </h3>

        {/* Prompt snippet preview */}
        <p className="text-[11px] text-slate-500 font-mono line-clamp-2 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
          {post.prompt_text}
        </p>

        {/* Visual clue: "Open Prompt" affordance */}
        <div className="pt-1 mt-auto flex items-center justify-between text-[11px] font-medium text-slate-500 group-hover:text-blue-600 transition-colors">
          <span className="text-[10px] sm:text-xs text-blue-600 font-semibold">
            ক্লিক করে বিস্তারিত দেখুন
          </span>
          <span className="text-blue-600 font-semibold group-hover:translate-x-1 transition-transform text-[10px] sm:text-xs">
            &rarr;
          </span>
        </div>
      </div>
    </article>
  );
};
