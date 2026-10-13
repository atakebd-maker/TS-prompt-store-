import React from 'react';
import { PromptPost } from '../types.ts';
import { X, Bookmark, Copy, Check, ExternalLink, Trash2 } from 'lucide-react';

interface SavedPromptsModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedPrompts: PromptPost[];
  onRemove: (postId: string) => void;
  onOpenPrompt: (post: PromptPost) => void;
}

export const SavedPromptsModal: React.FC<SavedPromptsModalProps> = ({
  isOpen,
  onClose,
  savedPrompts,
  onRemove,
  onOpenPrompt
}) => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (e: React.MouseEvent, post: PromptPost) => {
    e.stopPropagation();
    navigator.clipboard.writeText(post.prompt_text);
    setCopiedId(post.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <Bookmark className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                সংরক্ষিত প্রম্পট সমূহ (Saved Prompts)
              </h3>
              <p className="text-xs text-slate-500">
                আপনার পছন্দের {savedPrompts.length} টি প্রম্পট সংরক্ষিত রয়েছে
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-6 overflow-y-auto flex-grow space-y-3">
          {savedPrompts.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                <Bookmark className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm mb-1">
                কোন প্রম্পট সংরক্ষিত নেই
              </h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                যে কোনো প্রম্পট কার্ডের বুকমার্ক আইকনে ক্লিক করে আপনি পছন্দের প্রম্পট সংরক্ষণ করতে পারেন।
              </p>
            </div>
          ) : (
            savedPrompts.map((post) => (
              <div
                key={post.id}
                onClick={() => {
                  onOpenPrompt(post);
                  onClose();
                }}
                className="group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-slate-50/70 hover:bg-blue-50/40 rounded-xl border border-slate-200/80 hover:border-blue-200 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0 flex-grow">
                  {post.featured_image_url && (
                    <img
                      src={post.featured_image_url}
                      alt={post.title}
                      className="w-14 h-14 rounded-lg object-cover border border-slate-200 shrink-0"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  )}
                  <div className="min-w-0">
                    <h5 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                      {post.title}
                    </h5>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 font-mono">
                      {post.prompt_text}
                    </p>
                    {post.category_name && (
                      <span className="inline-block mt-1 text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        {post.category_name}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={(e) => handleCopy(e, post)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-blue-600 hover:text-white text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 hover:border-blue-600 transition-all shadow-xs"
                    title="প্রম্পট কপি করুন"
                  >
                    {copiedId === post.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500 group-hover:text-white" />
                        <span className="text-emerald-600">কপি হয়েছে</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>কপি</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(post.id);
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="রিমুভ করুন"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
