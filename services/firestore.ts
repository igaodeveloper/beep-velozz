import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  DocumentReference,
} from 'firebase/firestore';
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  User,
} from 'firebase/auth';
import * as SecureStore from 'expo-secure-store';

// the values below should be provided through Expo config (app.json/app.config.js) or
// environment variables (EXPO_PUBLIC_FIREBASE_*). during development you can also
// inject them via `expo start --config` or by reading from Constants.manifest.extra.
import Constants from 'expo-constants';

function getExpoValue(key: string): string | undefined {
  // Expo SDK 48+ uses expoConfig whereas older releases use manifest.
  const config: any = Constants.expoConfig || Constants.manifest || {};
  const extra = config.extra || {};
  // as a last resort, try reading from app.json directly (build-time constant)
  if (!extra[key]) {
    try {
      const appJson = require('../app.json');
      if (appJson.expo && appJson.expo.extra) {
        return appJson.expo.extra[key];
      }
    } catch {
      // ignore
    }
  }
  return extra[key] as string | undefined;
}

const firebaseConfig = {
  apiKey:
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY || getExpoValue('firebaseApiKey'),
  authDomain:
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || getExpoValue('firebaseAuthDomain'),
  projectId:
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || getExpoValue('firebaseProjectId'),
  storageBucket:
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || getExpoValue('firebaseStorageBucket'),
  messagingSenderId:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
    getExpoValue('firebaseMessagingSenderId'),
  appId:
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID || getExpoValue('firebaseAppId'),
};

// initialize once
function ensureFirebaseConfig(cfg: Record<string, any>) {
  const missing = Object.entries(cfg).filter(([, v]) => !v).map(([k])=>k);
  if (missing.length) {
    throw new Error(
      `Missing Firebase configuration keys: ${missing.join(', ')}. ` +
      `Set EXPO_PUBLIC_FIREBASE_<KEY> env vars or add the values under expo.extra ` +
      `in app.json (firebaseApiKey, firebaseProjectId, etc.).`
    );
  }
}
ensureFirebaseConfig(firebaseConfig);
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// --- helpers for our domain -------------------------------------------------

export interface Driver {
  id: string;
  name: string;
  active?: boolean;
}

export interface Operator {
  id: string;
  name: string;
  active?: boolean;
}

export type PackageType = 'shopee' | 'mercado_livre' | 'avulso';

export interface PackageRecord {
  code: string;
  type: PackageType;
  assignedDriverId: string;
  status?: 'pending' | 'scanned' | 'delivered';
  createdAt?: any; // Firestore timestamp
  scannedAt?: any;
}

// low-level fetch
export async function fetchDrivers(): Promise<Driver[]> {
  const col = collection(db, 'drivers');
  const snap = await getDocs(query(col, where('active', '==', true)));
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
}

// caching helpers (used for offline / fast startup)
const DRIVERS_CACHE_KEY = 'drivers_cache';

async function cacheDrivers(drivers: Driver[]) {
  try {
    await SecureStore.setItemAsync(DRIVERS_CACHE_KEY, JSON.stringify(drivers));
  } catch {}
}

export async function getCachedDrivers(): Promise<Driver[]> {
  try {
    const raw = await SecureStore.getItemAsync(DRIVERS_CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// high-level that returns cached data immediately and refreshes in background
export async function fetchDriversWithCache(): Promise<Driver[]> {
  const cached = await getCachedDrivers();
  fetchDrivers()
    .then(d => cacheDrivers(d))
    .catch(() => {});
  if (cached.length) {
    return cached;
  }
  const fresh = await fetchDrivers();
  await cacheDrivers(fresh);
  return fresh;
}

// fetch operators (similar)
export async function fetchOperators(): Promise<Operator[]> {
  const col = collection(db, 'operators');
  const snap = await getDocs(query(col, where('active', '==', true)));
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
}

// fetch packages that belong to a driver
export async function fetchPackagesForDriver(driverId: string): Promise<PackageRecord[]> {
  const col = collection(db, 'packages');
  const q = query(col, where('assignedDriverId', '==', driverId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
}

// cache for packages per driver
async function cachePackages(driverId: string, pkgs: PackageRecord[]) {
  try {
    await SecureStore.setItemAsync(
      `${PACKAGES_CACHE_PREFIX}${driverId}`,
      JSON.stringify(pkgs)
    );
  } catch {}
}

const PACKAGES_CACHE_PREFIX = 'packages_cache_';

export async function getCachedPackages(driverId: string): Promise<PackageRecord[]> {
  try {
    const raw = await SecureStore.getItemAsync(
      `${PACKAGES_CACHE_PREFIX}${driverId}`
    );
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function fetchPackagesForDriverWithCache(
  driverId: string
): Promise<PackageRecord[]> {
  const cached = await getCachedPackages(driverId);
  fetchPackagesForDriver(driverId)
    .then(p => cachePackages(driverId, p))
    .catch(() => {});
  if (cached.length) {
    return cached;
  }
  const fresh = await fetchPackagesForDriver(driverId);
  await cachePackages(driverId, fresh);
  return fresh;
}

// mark a package as scanned (with optional extra data)
export async function markPackageScanned(packageCode: string, driverId: string) {
  const col = collection(db, 'packages');
  const q = query(col, where('code', '==', packageCode));
  const snap = await getDocs(q);
  if (snap.empty) {
    throw new Error('package-not-found');
  }
  const docRef = snap.docs[0].ref;
  await updateDoc(docRef, {
    status: 'scanned',
    scannedAt: serverTimestamp(),
  });
}

// create / update an operator or driver (used by admin screens)
export async function upsertDriver(driver: Partial<Driver> & { id?: string }) {
  if (driver.id) {
    const ref = doc(db, 'drivers', driver.id);
    await setDoc(ref, driver, { merge: true });
    return driver.id;
  }
  const ref = await addDoc(collection(db, 'drivers'), driver);
  return ref.id;
}

// --------------------------------------------------
// AUTH helpers (firestore authentication is optional) 
// --------------------------------------------------

export function onAuthStateChange(
  callback: (user: User | null) => void
) {
  return onAuthStateChanged(auth, callback);
}

export async function loginOperator(
  email: string,
  password: string
): Promise<User> {
  const res = await signInWithEmailAndPassword(auth, email, password);
  return res.user;
}

export async function logout(): Promise<void> {
  await signOut(auth);
}

// ...add more helpers as needed (sessions, counts, etc.)
