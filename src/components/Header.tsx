import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Sparkles, User, Bookmark, LogOut, ShieldCheck, ChevronDown, LogIn } from 'lucide-react';
import { AppUserProfile } from '../firebase.ts';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onNavigateHome: () => void;
  currentUser: AppUserProfile | null;
  onOpenAuth: () => void;
  onOpenSaved: () => void;
  savedCount: number;
  onLogout: () => void;
  onOpenAdmin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  onNavigateHome,
  currentUser,
  onOpenAuth,
  onOpenSaved,
  savedCount,
  onLogout,
  onOpenAdmin
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-3.5 sm:py-4">
          {/* Logo & Brand */}
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

            {/* Mobile Auth Button */}
            <div className="sm:hidden">
              {currentUser ? (
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-full"
                >
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || ''}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                      {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                </button>
              ) : (
                <button
                  onClick={onOpenAuth}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 rounded-lg border border-blue-200"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>লগইন</span>
                </button>
              )}
            </div>
          </div>

          {/* Search Box */}
          <div className="w-full sm:w-72 md:w-80 lg:w-[400px]">
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center">
                <Search className="w-4 h-4 text-blue-500" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search prompts by title, keywords, style..."
                className="w-full pl-10 pr-9 py-2 text-xs sm:text-sm bg-slate-50 hover:bg-slate-50/80 focus:bg-white text-slate-900 placeholder:text-slate-400 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
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

          {/* User Account & Action Bar (Desktop) */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Saved prompts quick access */}
            <button
              type="button"
              onClick={onOpenSaved}
              className="relative flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 rounded-xl border border-slate-200/80 transition-all"
              title="সংরক্ষিত প্রম্পট সমূহ"
            >
              <Bookmark className="w-4 h-4 text-blue-600" />
              <span>সংরক্ষিত প্রম্পট</span>
              {savedCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold text-white bg-blue-600 rounded-full">
                  {savedCount}
                </span>
              )}
            </button>

            {/* Auth status */}
            {currentUser ? (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 p-1.5 pr-3 bg-slate-50 hover:bg-slate-100 rounded-full border border-slate-200 transition-all"
                >
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || ''}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                      {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <span className="text-xs font-bold text-slate-800 max-w-[100px] truncate">
                    {currentUser.displayName || currentUser.email?.split('@')[0]}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {currentUser.displayName || 'ব্যবহারকারী'}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {currentUser.email}
                      </p>
                      {currentUser.role === 'admin' && (
                        <span className="inline-block mt-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          এডমিন একাউন্ট
                        </span>
                      )}
                    </div>

                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onOpenSaved();
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-left"
                      >
                        <Bookmark className="w-4 h-4 text-blue-600" />
                        <span>আমার সংরক্ষিত প্রম্পট ({savedCount})</span>
                      </button>

                      {currentUser.role === 'admin' && onOpenAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            setMenuOpen(false);
                            onOpenAdmin();
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors text-left"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>এডমিন প্যানেলে যান</span>
                        </button>
                      )}
                    </div>

                    <div className="border-t border-slate-100 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>লগআউট করুন</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span>লগইন / সাইন আপ</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {menuOpen && (
          <div className="sm:hidden py-3 border-t border-slate-100 space-y-2">
            {currentUser && (
              <div className="px-2 pb-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900">
                  {currentUser.displayName}
                </p>
                <p className="text-[11px] text-slate-500">
                  {currentUser.email}
                </p>
              </div>
            )}
            <button
              onClick={() => {
                setMenuOpen(false);
                onOpenSaved();
              }}
              className="w-full flex items-center justify-between p-2 text-xs font-semibold text-slate-700 bg-slate-50 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-blue-600" />
                <span>সংরক্ষিত প্রম্পট</span>
              </div>
              <span className="text-[10px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded-full">
                {savedCount}
              </span>
            </button>
            {currentUser?.role === 'admin' && onOpenAdmin && (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onOpenAdmin();
                }}
                className="w-full flex items-center gap-2 p-2 text-xs font-semibold text-blue-600 bg-blue-50 rounded-lg"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>এডমিন প্যানেলে যান</span>
              </button>
            )}
            {currentUser && (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center gap-2 p-2 text-xs font-semibold text-red-600 bg-red-50 rounded-lg"
              >
                <LogOut className="w-4 h-4" />
                <span>লগআউট করুন</span>
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
