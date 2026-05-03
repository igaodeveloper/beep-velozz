// src/services/firebase.ts
/**
 * Firebase initialization and exports
 * 
 * This module initializes Firebase with the configured credentials
 * and provides analytics capabilities.
 * 
 * Import Firebase functions directly from 'firebase/firestore' and 'firebase/auth'
 * Import db and auth from this module for already-initialized instances
 * 
 * Example:
 * ```typescript
 * import { db, auth } from '@/services/firebase';
 * import { collection, addDoc } from 'firebase/firestore';
 * 
 * const docRef = await addDoc(collection(db, 'sessions'), {...});
 * ```
 */

import { initializeApp } from "firebase/app";
import { getAnalytics, Analytics } from "firebase/analytics";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { FIREBASE_CONFIG, validateFirebaseConfig } from "@/config/firebaseConfig";

// Validate Firebase configuration before initialization
validateFirebaseConfig(FIREBASE_CONFIG);

// Import the functions you need from the SDKs you need
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = FIREBASE_CONFIG;

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics (Web only)
let analytics: Analytics | null = null;
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn(
      "Analytics initialization warning (may be expected in development):",
      error
    );
  }
} else {
  // React Native environment - Analytics not available
  console.debug("Firebase Analytics skipped (React Native environment)");
}

// Export Firebase instances for use throughout the app
export const db: Firestore = getFirestore(app);

// Lazy-initialize auth to avoid "Component auth has not been registered yet" error
let authInstance: Auth | null = null;

export function getAuthInstance(): Auth {
  if (!authInstance) {
    authInstance = getAuth(app);
  }
  return authInstance;
}

// For backward compatibility with existing code
Object.defineProperty(exports, 'auth', {
  get: () => getAuthInstance(),
});

export { analytics };

// Export the app instance for advanced use cases
export default app;
