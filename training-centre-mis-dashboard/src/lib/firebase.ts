import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Single Firebase App Instance
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Single Firebase Auth Instance
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export {
  signInWithPopup,
  firebaseSignOut,
  onAuthStateChanged,
};
export type { User };
