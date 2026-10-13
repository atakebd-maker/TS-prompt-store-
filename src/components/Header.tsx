import React from 'react';
import { Search, X, Sparkles } from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onNavigateHome: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  onNavigateHome
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-3.5 sm:py-4">
          {/* Text Logo: TS Prompt Store */}
          <div className="flex items-center justify-between w-full sm:w-auto">
            <button
              onClick={onNavigateHome}
              className="group text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg"
              title="TS Prompt Store - Home"
            >
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-2xl sm:text-3xl tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                  TS <span className="text-blue-600">Prompt</span> Store
                </span>
                <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 rounded border border-blue-100">
                  AI Hub
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 tracking-wide font-medium">
                Curated AI Photo &amp; Video Prompts
              </p>
            </button>
          </div>

          {/* Search Box */}
          <div className="w-full sm:w-80 md:w-96 lg:w-[440px]">
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center">
                <Search className="w-4 h-4 text-blue-500" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search prompts by title, keywords, style..."
                className="w-full pl-10 pr-9 py-2.5 text-sm bg-slate-50/80 hover:bg-slate-50 focus:bg-white text-slate-900 placeholder:text-slate-400 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 p-0.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60 transition-colors"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
