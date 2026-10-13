import React, { useState } from 'react';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  syncUserProfile,
  AppUserProfile
} from '../firebase.ts';
import { X, Mail, Lock, User as UserIcon, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: AppUserProfile) => void;
  defaultTab?: 'login' | 'register';
  customMessage?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultTab = 'login',
  customMessage
}) => {
  const [tab, setTab] = useState<'login' | 'register'>(defaultTab);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const getReadableError = (errCode: string): string => {
    switch (errCode) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'ইমেইল বা পাসওয়ার্ড সঠিক নয়। অনুগ্রহ করে আবার চেষ্টা করুন।';
      case 'auth/email-already-in-use':
        return 'এই ইমেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট তৈরি করা হয়েছে। লগইন করুন।';
      case 'auth/weak-password':
        return 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।';
      case 'auth/invalid-email':
        return 'অনুগ্রহ করে একটি সঠিক ইমেইল এড্রেস লিখুন।';
      case 'auth/popup-closed-by-user':
        return 'গুগল সাইন-ইন উইন্ডো বন্ধ করা হয়েছে।';
      case 'auth/network-request-failed':
        return 'ইন্টারনেট সংযোগে সমস্যা হয়েছে। আবার চেষ্টা করুন।';
      default:
        return 'একটি সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।';
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const profile = await syncUserProfile(res.user);
      onSuccess(profile);
      onClose();
    } catch (err: any) {
      console.error('Google sign in error:', err);
      setError(getReadableError(err?.code || ''));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('ইমেইল ও পাসওয়ার্ড প্রদান করুন');
      return;
    }
    if (tab === 'register' && !name.trim()) {
      setError('আপনার নাম লিখুন');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (tab === 'register') {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        if (name.trim()) {
          await updateProfile(res.user, { displayName: name.trim() });
        }
        const profile = await syncUserProfile(res.user);
        onSuccess(profile);
      } else {
        const res = await signInWithEmailAndPassword(auth, email, password);
        const profile = await syncUserProfile(res.user);
        onSuccess(profile);
      }
      onClose();
    } catch (err: any) {
      console.error('Email auth error:', err);
      setError(getReadableError(err?.code || ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar with close button */}
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-xl tracking-tight text-slate-900">
              TS <span className="text-blue-600">Prompt</span> Store
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
            title="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Custom message prompt */}
        {customMessage && (
          <div className="mx-6 mt-2 mb-1 p-2.5 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-2 text-xs text-blue-700 font-medium">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{customMessage}</span>
          </div>
        )}

        {/* Tab switchers */}
        <div className="px-6 pt-3">
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setError(null);
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                tab === 'login'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              লগইন (Sign In)
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('register');
                setError(null);
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                tab === 'register'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              নতুন একাউন্ট (Sign Up)
            </button>
          </div>
        </div>

        <div className="p-6 pt-4 space-y-4">
          {/* Error display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs sm:text-sm text-slate-700 shadow-xs hover:shadow transition-all disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>গুগল দিয়ে দ্রুত সাইন ইন (Google Login)</span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              অথবা ইমেইল দিয়ে
            </span>
            <div className="border-t border-slate-200 w-full" />
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-3">
            {tab === 'register' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  আপনার নাম (Full Name)
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="যেমন: তাহসিন আহমেদ"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ইমেইল এড্রেস (Email Address)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                পাসওয়ার্ড (Password)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="কমপক্ষে ৬ অক্ষর..."
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{tab === 'login' ? 'লগইন করুন' : 'অ্যাকাউন্ট খুলুন'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-[11px] text-center text-slate-400">
            {tab === 'login'
              ? 'অ্যাকাউন্ট নেই? '
              : 'ইতিমধ্যে অ্যাকাউন্ট আছে? '}
            <button
              type="button"
              onClick={() => {
                setTab(tab === 'login' ? 'register' : 'login');
                setError(null);
              }}
              className="text-blue-600 font-bold hover:underline"
            >
              {tab === 'login' ? 'নতুন অ্যাকাউন্ট তৈরি করুন' : 'লগইন করুন'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
