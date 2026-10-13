import React, { useEffect, useState } from 'react';
import { PromptPost } from '../types.ts';
import { api } from '../api/client.ts';
import { CopyButton } from '../components/CopyButton.tsx';
import { PlatformShortcuts } from '../components/PlatformShortcuts.tsx';
import { PromptCard } from '../components/PromptCard.tsx';
import { ImageModal } from '../components/ImageModal.tsx';
import { ArrowLeft, Calendar, Tag, Maximize2, Share2, Check } from 'lucide-react';

interface PromptDetailPageProps {
  slug: string;
  onNavigateHome: () => void;
  onOpenPost: (post: PromptPost) => void;
}

export const PromptDetailPage: React.FC<PromptDetailPageProps> = ({
  slug,
  onNavigateHome,
  onOpenPost
}) => {
  const [post, setPost] = useState<PromptPost | null>(null);
  const [related, setRelated] = useState<PromptPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);
  const [shareCopied, setShareCopied] = useState<boolean>(false);

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);

    api
      .getPostBySlug(slug)
      .then((data) => {
        if (!isCancelled) {
          setPost(data.post);
          setRelated(data.related || []);
          setLoading(false);
          // Dynamic SEO Document Title
          document.title = `${data.post.title} — TS Prompt Store`;
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error('Failed to load post detail:', err);
          setError(err.message || 'Prompt post not found.');
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [slug]);

  const handleShare = async () => {
    try {
      const url = window.location.href;
      if (navigator.share) {
        await navigator.share({
          title: post?.title,
          text: `Check out this AI prompt on TS Prompt Store: ${post?.title}`,
          url
        });
      } else {
        await navigator.clipboard.writeText(url);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2500);
      }
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded-lg w-3/4" />
          <div className="aspect-[16/10] bg-slate-200 rounded-2xl w-full" />
          <div className="h-32 bg-slate-200 rounded-xl w-full" />
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Prompt Not Found</h2>
        <p className="text-sm text-slate-500 mb-6">
          {error || "The prompt you're looking for doesn't exist or is currently unpublished."}
        </p>
        <button
          onClick={onNavigateHome}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to All Prompts
        </button>
      </div>
    );
  }

  const publishedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
    : null;

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
      {/* Back button and quick actions */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={onNavigateHome}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors py-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Prompts</span>
        </button>

        <button
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          title="Share prompt link"
        >
          {shareCopied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-600">Link Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </>
          )}
        </button>
      </div>

      {/* 1. Post title at the top */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-2 text-xs font-semibold text-slate-500">
          <span className="text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">
            {post.category_name}
          </span>
          {publishedDate && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              {publishedDate}
            </span>
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
          {post.title}
        </h1>
        {post.description && (
          <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed">
            {post.description}
          </p>
        )}
      </div>

      {/* 2. Featured image below the title */}
      <div className="relative mb-6 sm:mb-8 group">
        <div className="relative rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 shadow-md">
          <img
            src={post.featured_image_url}
            alt={post.title}
            referrerPolicy="no-referrer"
            className="w-full max-h-[580px] object-contain sm:object-cover bg-slate-950/5 cursor-zoom-in transition-all"
            onClick={() => setLightboxOpen(true)}
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              const fallback = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22800%22%20height%3D%22500%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%232563eb%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20fill%3D%22%23ffffff%22%20font-size%3D%2224%22%20font-family%3D%22sans-serif%22%20text-anchor%3D%22middle%22%20dy%3D%22.3em%22%3ETS%20Prompt%20Image%3C%2Ftext%3E%3C%2Fsvg%3E';
              if (img.src !== fallback) {
                img.src = fallback;
              }
            }}
          />

          {/* Enlarge inspect button */}
          <button
            onClick={() => setLightboxOpen(true)}
            className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-black/75 hover:bg-black/90 backdrop-blur-md text-white rounded-lg text-xs font-semibold transition-all shadow"
            title="Inspect full image"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>View Full Image</span>
          </button>
        </div>
      </div>

      {/* 3. English prompt inside a readable, bordered text box */}
      <div className="mb-5 sm:mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            English Prompt Text
          </span>
          <span className="text-[11px] text-slate-400 font-medium">
            Ready for copy &amp; paste
          </span>
        </div>

        <div className="relative bg-slate-50 border-2 border-blue-100 rounded-2xl p-4 sm:p-6 transition-all hover:border-blue-300">
          <p className="font-mono text-sm sm:text-base text-slate-800 leading-relaxed whitespace-pre-wrap select-all font-medium">
            {post.prompt_text}
          </p>

          {post.search_keywords && (
            <div className="mt-4 pt-3 border-t border-slate-200/80 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
              <Tag className="w-3.5 h-3.5 text-blue-500" />
              <span className="font-medium text-slate-600">Keywords:</span>
              {post.search_keywords.split(',').map((kw, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[11px] font-medium text-slate-600"
                >
                  {kw.trim()}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4. Prominent Copy Prompt button */}
      <div className="mb-8">
        <CopyButton
          textToCopy={post.prompt_text}
          buttonLabel="Copy Full Prompt"
          className="w-full sm:w-auto"
        />
      </div>

      {/* 5. AI platform buttons below the copy button */}
      <div className="mb-10 sm:mb-12 border-t border-slate-100 pt-6">
        <PlatformShortcuts />
      </div>

      {/* 6. More prompts from the same category below AI platform buttons */}
      <div className="border-t border-slate-200 pt-8 sm:pt-10">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
            More in {post.category_name}
          </h2>
          <span className="text-xs font-semibold text-slate-400">
            {related.length} related
          </span>
        </div>

        {related.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-5">
            {related.map((relPost) => (
              <PromptCard
                key={relPost.id}
                post={relPost}
                onOpen={onOpenPost}
              />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200/60">
            <p className="text-sm font-medium text-slate-500">
              No other prompts found in this category right now.
            </p>
          </div>
        )}
      </div>

      {/* Fullscreen Lightbox Modal */}
      {lightboxOpen && (
        <ImageModal
          imageUrl={post.featured_image_url}
          title={post.title}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </article>
  );
};
