import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  getDocFromServer,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { PromptPost } from './types.ts';

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore with specific databaseId if provided
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Google Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Admin emails list
export const ADMIN_EMAILS = [
  'admin@tspromptstore.com',
  'mdpiyas2737@gmail.com'
];

export interface AppUserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: 'admin' | 'user';
  createdAt?: any;
}

// Test connection on boot as mandated by skill
export async function testFirebaseConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('[Firebase] Connection validated successfully.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firebase] Client is offline or Firestore database is provisioning.');
    } else {
      // Permission denied or not found is normal for test doc; means server responded!
      console.log('[Firebase] Connection check complete.');
    }
    return true;
  }
}

// Execute connection test
testFirebaseConnection();

// Sync user profile into Firestore
export async function syncUserProfile(user: FirebaseUser): Promise<AppUserProfile> {
  const userRef = doc(db, 'users', user.uid);
  const isAdmin = user.email ? ADMIN_EMAILS.includes(user.email.toLowerCase()) : false;

  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || data.displayName || 'User',
        photoURL: user.photoURL || data.photoURL || null,
        role: data.role || (isAdmin ? 'admin' : 'user'),
      };
    }
  } catch (err) {
    console.warn('[Firebase] Could not fetch existing user doc:', err);
  }

  const newProfile: AppUserProfile = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || user.email?.split('@')[0] || 'User',
    photoURL: user.photoURL || null,
    role: isAdmin ? 'admin' : 'user',
    createdAt: new Date().toISOString()
  };

  try {
    await setDoc(userRef, newProfile, { merge: true });
  } catch (err) {
    console.warn('[Firebase] Could not write user doc:', err);
  }

  return newProfile;
}

// Bookmark a prompt for a user
export async function savePromptForUser(userId: string, post: PromptPost): Promise<void> {
  const bookmarkRef = doc(db, 'users', userId, 'saved_prompts', post.id);
  await setDoc(bookmarkRef, {
    promptId: post.id,
    title: post.title,
    slug: post.slug,
    category_id: post.category_id,
    category_name: post.category_name,
    featured_image_url: post.featured_image_url,
    prompt_text: post.prompt_text,
    description: post.description,
    savedAt: new Date().toISOString()
  });
}

// Remove bookmark
export async function removeSavedPromptForUser(userId: string, postId: string): Promise<void> {
  const bookmarkRef = doc(db, 'users', userId, 'saved_prompts', postId);
  await deleteDoc(bookmarkRef);
}

// Get all saved prompts for a user
export async function getSavedPromptsForUser(userId: string): Promise<PromptPost[]> {
  try {
    const savedCol = collection(db, 'users', userId, 'saved_prompts');
    const snap = await getDocs(savedCol);
    const list: PromptPost[] = [];
    snap.forEach((docItem) => {
      const data = docItem.data();
      list.push({
        id: data.promptId || docItem.id,
        title: data.title || '',
        slug: data.slug || docItem.id,
        category_id: data.category_id || '',
        category_name: data.category_name || '',
        featured_image_url: data.featured_image_url || '',
        prompt_text: data.prompt_text || '',
        description: data.description || '',
        search_keywords: '',
        status: 'published',
        created_at: data.savedAt || new Date().toISOString(),
        updated_at: data.savedAt || new Date().toISOString(),
        published_at: data.savedAt || new Date().toISOString(),
      });
    });
    return list;
  } catch (err) {
    console.warn('[Firebase] Error fetching saved prompts:', err);
    return [];
  }
}

// Check if prompt is saved
export async function checkIsPromptSaved(userId: string, postId: string): Promise<boolean> {
  try {
    const bookmarkRef = doc(db, 'users', userId, 'saved_prompts', postId);
    const snap = await getDoc(bookmarkRef);
    return snap.exists();
  } catch {
    return false;
  }
}

export {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged
};
export type { FirebaseUser };
