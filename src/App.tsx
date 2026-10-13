/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Category, PromptPost, AdminUser } from './types.ts';
import { api, authStorage } from './api/client.ts';
import {
  auth,
  onAuthStateChanged,
  signOut,
  syncUserProfile,
  savePromptForUser,
  removeSavedPromptForUser,
  getSavedPromptsForUser,
  AppUserProfile,
  ADMIN_EMAILS
} from './firebase.ts';
import { Header } from './components/Header.tsx';
import { CategoryNav } from './components/CategoryNav.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { PromptDetailPage } from './pages/PromptDetailPage.tsx';
import { AdminLogin } from './pages/AdminLogin.tsx';
import { AdminDashboard } from './pages/AdminDashboard.tsx';
import { NotFoundPage } from './pages/NotFoundPage.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { SavedPromptsModal } from './components/SavedPromptsModal.tsx';
import { Check, Bookmark, Sparkles } from 'lucide-react';

// Exact specified hidden admin route
const ADMIN_ROUTE = '/Admin-nexappo-tahsin-2013';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Admin authentication state (legacy token or admin session)
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [authChecking, setAuthChecking] = useState<boolean>(true);

  // Firebase user authentication state
  const [currentUser, setCurrentUser] = useState<AppUserProfile | null>(null);
  const [savedPrompts, setSavedPrompts] = useState<PromptPost[]>([]);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authCustomMsg, setAuthCustomMsg] = useState<string | undefined>(undefined);
  const [savedModalOpen, setSavedModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Sync navigation on browser Back/Forward
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Navigate helper
  const navigate = (path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
      setCurrentPath(path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Firebase auth state observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const profile = await syncUserProfile(fbUser);
          setCurrentUser(profile);
          // If the Firebase user is an admin, set adminUser state as well
          const isAdmin =
            profile.role === 'admin' ||
            (fbUser.email ? ADMIN_EMAILS.includes(fbUser.email.toLowerCase()) : false);

          if (isAdmin && !adminUser) {
            setAdminUser({
              id: fbUser.uid,
              email: fbUser.email || 'admin@tspromptstore.com'
            });
          }

          // Fetch saved prompts
          const saved = await getSavedPromptsForUser(fbUser.uid);
          setSavedPrompts(saved);
        } catch (err) {
          console.warn('[Firebase] Auth state sync error:', err);
        }
      } else {
        setCurrentUser(null);
        setSavedPrompts([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Check legacy admin session on mount
  useEffect(() => {
    const token = authStorage.getToken();
    if (token) {
      api
        .adminVerifySession()
        .then((res) => {
          if (res.authenticated && res.admin) {
            setAdminUser(res.admin);
          } else {
            authStorage.clearToken();
            setAdminUser(null);
          }
        })
        .catch(() => {
          authStorage.clearToken();
          setAdminUser(null);
        })
        .finally(() => {
          setAuthChecking(false);
        });
    } else {
      setAuthChecking(false);
    }
  }, []);

  // Load public categories
  useEffect(() => {
    api
      .getCategories()
      .then((cats) => {
        setCategories(cats);
      })
      .catch((err) => {
        console.error('Failed to load categories:', err);
      });
  }, []);

  // Update default document title when on home or admin
  useEffect(() => {
    if (currentPath === ADMIN_ROUTE) {
      document.title = 'TS Prompt Store — Admin Access';
    } else if (currentPath === '/' || currentPath === '') {
      document.title = 'TS Prompt Store — AI Photo & Video Prompts';
    }
  }, [currentPath]);

  // Handle bookmark / save toggle
  const handleToggleSave = async (post: PromptPost, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    if (!currentUser) {
      setAuthCustomMsg('প্রম্পট সংরক্ষণ করার জন্য দয়া করে একাউন্টে সাইন ইন করুন');
      setAuthModalOpen(true);
      return;
    }

    const isAlreadySaved = savedPrompts.some((p) => p.id === post.id);

    try {
      if (isAlreadySaved) {
        await removeSavedPromptForUser(currentUser.uid, post.id);
        setSavedPrompts((prev) => prev.filter((p) => p.id !== post.id));
        showToast('প্রম্পট সংরক্ষণ তালিকা থেকে মুছে ফেলা হয়েছে');
      } else {
        await savePromptForUser(currentUser.uid, post);
        setSavedPrompts((prev) => [...prev, post]);
        showToast('প্রম্পটটি সফলভাবে সংরক্ষিত হয়েছে!');
      }
    } catch (err) {
      console.error('Toggle save error:', err);
      showToast('সংরক্ষণ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    }
  };

  // Handle remove saved prompt from modal
  const handleRemoveSaved = async (postId: string) => {
    if (!currentUser) return;
    try {
      await removeSavedPromptForUser(currentUser.uid, postId);
      setSavedPrompts((prev) => prev.filter((p) => p.id !== postId));
      showToast('তালিকা থেকে মুছে ফেলা হয়েছে');
    } catch (err) {
      console.error('Failed to remove saved prompt:', err);
    }
  };

  // Handle user logout
  const handleUserLogout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setSavedPrompts([]);
      showToast('সফলভাবে লগআউট করা হয়েছে');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const savedPostIds = savedPrompts.map((p) => p.id);

  // Route 1: Exact Hidden Admin Route (/Admin-nexappo-tahsin-2013)
  if (currentPath === ADMIN_ROUTE) {
    if (authChecking) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-semibold text-slate-500">Checking credentials...</p>
          </div>
        </div>
      );
    }

    if (!adminUser) {
      return (
        <AdminLogin
          onLoginSuccess={(admin) => setAdminUser(admin)}
          onExit={() => navigate('/')}
        />
      );
    }

    return (
      <AdminDashboard
        admin={adminUser}
        initialCategories={categories}
        onCategoriesUpdate={(newCats) => setCategories(newCats)}
        onLogout={async () => {
          await api.adminLogout();
          setAdminUser(null);
        }}
        onPreviewPublicPost={(slug) => {
          navigate(`/prompt/${slug}`);
        }}
      />
    );
  }

  // Route 2: Individual Prompt Detail Page (/prompt/:slug)
  const isPromptDetail = currentPath.startsWith('/prompt/');
  const promptSlug = isPromptDetail ? currentPath.replace(/^\/prompt\//, '') : '';

  // Determine which main view to show
  const isHome = currentPath === '/' || currentPath === '';

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs sm:text-sm font-semibold border border-slate-800 animate-in slide-in-from-bottom-3 duration-200">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Public Website Header */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          if (!isHome) navigate('/');
        }}
        onNavigateHome={() => {
          setSearchQuery('');
          setSelectedCategory('all');
          navigate('/');
        }}
        currentUser={currentUser}
        onOpenAuth={() => {
          setAuthCustomMsg(undefined);
          setAuthModalOpen(true);
        }}
        onOpenSaved={() => setSavedModalOpen(true)}
        savedCount={savedPrompts.length}
        onLogout={handleUserLogout}
        onOpenAdmin={() => navigate(ADMIN_ROUTE)}
      />

      {/* Category Navigation right below header */}
      {isHome && (
        <CategoryNav
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={(catSlug) => {
            setSelectedCategory(catSlug);
          }}
        />
      )}

      {/* Main View */}
      <main className="flex-grow">
        {isPromptDetail && promptSlug ? (
          <PromptDetailPage
            slug={promptSlug}
            onNavigateHome={() => navigate('/')}
            onOpenPost={(post) => navigate(`/prompt/${post.slug}`)}
            savedPostIds={savedPostIds}
            onToggleSave={handleToggleSave}
          />
        ) : isHome ? (
          <HomePage
            categories={categories}
            selectedCategory={selectedCategory}
            searchQuery={searchQuery}
            onSelectCategory={(catSlug) => setSelectedCategory(catSlug)}
            onOpenPost={(post) => navigate(`/prompt/${post.slug}`)}
            onResetSearch={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            savedPostIds={savedPostIds}
            onToggleSave={handleToggleSave}
          />
        ) : (
          <NotFoundPage onNavigateHome={() => navigate('/')} />
        )}
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        customMessage={authCustomMsg}
        onSuccess={(profile) => {
          setCurrentUser(profile);
          showToast(`স্বাগতম, ${profile.displayName || 'User'}!`);
        }}
      />

      {/* Saved Prompts Modal */}
      <SavedPromptsModal
        isOpen={savedModalOpen}
        onClose={() => setSavedModalOpen(false)}
        savedPrompts={savedPrompts}
        onRemove={handleRemoveSaved}
        onOpenPrompt={(post) => navigate(`/prompt/${post.slug}`)}
      />

      {/* Public Footer */}
      <footer className="border-t border-slate-100 bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <span className="font-extrabold text-base tracking-tight text-slate-800">
              TS <span className="text-blue-600">Prompt</span> Store
            </span>
            <p className="text-xs text-slate-500 mt-0.5">
              High-resolution photo and video prompt sharing platform.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 font-medium">
            <span>&copy; {new Date().getFullYear()} TS Prompt Store. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
