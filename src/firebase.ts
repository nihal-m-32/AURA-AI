// Firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, User } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Google Provider
const provider = new GoogleAuthProvider();

// Sign in function
export async function signInWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, provider);
    console.log('User signed in:', result.user);
    return result.user;
  } catch (error: any) {
    console.error('Sign-in error:', error.message);
    alert('Sign-in failed: ' + error.message);
    return null;
  }
}

// Sign out function
export async function signOutUser(): Promise<void> {
  try {
    await signOut(auth);
    console.log('User signed out');
  } catch (error: any) {
    console.error('Sign-out error:', error.message);
    alert('Sign-out failed: ' + error.message);
  }
}

// Get current user
export function getCurrentUser(): User | null {
  return auth.currentUser;
}