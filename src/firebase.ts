// Firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, User } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Firebase Services
export const auth = getAuth(app);
export const db = getFirestore(app); // Default Firestore
export const storage = getStorage(app);

// Google Auth Provider
const provider = new GoogleAuthProvider();

/**
 * Sign in with Google
 */
export async function signInWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, provider);
    console.log('Signed in user:', result.user);
    return result.user;
  } catch (error: any) {
    console.error('Sign-in error:', error.message);
    alert('Sign-in failed: ' + error.message);
    return null;
  }
}

/**
 * Sign out the current user
 */
export async function signOutUser(): Promise<void> {
  try {
    await signOut(auth);
    console.log('User signed out');
  } catch (error: any) {
    console.error('Sign-out error:', error.message);
    alert('Sign-out failed: ' + error.message);
  }
}

/**
 * Check if user is signed in
 */
export function getCurrentUser(): User | null {
  return auth.currentUser;
}