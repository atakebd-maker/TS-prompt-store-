/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Category, PromptPost, AdminUser } from './types.ts';
import { api, authStorage } from './api/client.ts';
import { Header } from './components/Header.tsx';
import { CategoryNav } from './components/CategoryNav.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { PromptDetailPage } from './pages/PromptDetailPage.tsx';
import { AdminLogin } from './pages/AdminLogin.tsx';
import { AdminDashboard } from './pages/AdminDashboard.tsx';
import { NotFoundPage } from './pages/NotFoundPage.tsx';

// Exact specified hidden admin route
const ADMIN_ROUTE = '/Admin-nexappo-tahsin-2013';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Admin authentication state
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [authChecking, setAuthChecking] = useState<boolean>(true);

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

  // Check admin session on mount
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
      {/* 2. Public Website Header with text logo and search */}
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
          />
        ) : (
          <NotFoundPage onNavigateHome={() => navigate('/')} />
        )}
      </main>

      {/* Public Footer (Strictly WITHOUT any admin links or buttons) */}
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
