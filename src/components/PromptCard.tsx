import React from 'react';
import { PromptPost } from '../types.ts';
import { ArrowUpRight, Copy, Check } from 'lucide-react';

interface PromptCardProps {
  post: PromptPost;
  onOpen: (post: PromptPost) => void;
  onQuickCopy?: (prompt: string, e: React.MouseEvent) => void;
  isCopied?: boolean;
}

export const PromptCard: React.FC<PromptCardProps> = ({
  post,
  onOpen,
  onQuickCopy,
  isCopied
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
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          onError={(e) => {
            // Fallback placeholder image if URL fails
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80';
          }}
        />

        {/* Visual Open Indicator Badge (Hover on desktop, subtle on mobile) */}
        <div className="absolute top-2 right-2 flex items-center gap-1">
          {onQuickCopy && (
            <button
              type="button"
              onClick={(e) => onQuickCopy(post.prompt_text, e)}
              className="p-1.5 sm:p-2 bg-white/90 backdrop-blur-md rounded-lg text-slate-700 hover:text-blue-600 hover:bg-white shadow-sm transition-all"
              title="Copy prompt immediately"
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
        {post.category_name.toLowerCase().includes('video') && (
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

        {/* Visual clue: "Open Prompt" affordance */}
        <div className="pt-1 mt-auto flex items-center justify-between text-[11px] font-medium text-slate-500 group-hover:text-blue-600 transition-colors">
          <span className="text-[10px] sm:text-xs">View full prompt</span>
          <span className="text-blue-600 font-semibold group-hover:underline text-[10px] sm:text-xs">
            Details &rarr;
          </span>
        </div>
      </div>
    </article>
  );
};
