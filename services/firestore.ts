import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
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
  enableNetwork,
  disableNetwork,
  onSnapshot,
} from "firebase/firestore";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  User,
} from "firebase/auth";
import * as SecureStore from "expo-secure-store";
import { FIREBASE_CONFIG, validateFirebaseConfig } from "../src/config/firebaseConfig";

// Import the functions you need from the SDKs you need
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = FIREBASE_CONFIG;

// Validate Firebase configuration
validateFirebaseConfig(firebaseConfig);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);

// Lazy-initialize auth to avoid "Component auth has not been registered yet" error
let authInstance: any = null;

export function getAuthInstance() {
  if (!authInstance) {
    authInstance = getAuth(app);
  }
  return authInstance;
}

// For backward compatibility, export as a getter
export const auth = {
  get current() {
    return getAuthInstance();
  }
};

// --- Network Status Management ---
let isOnline = true;
let networkErrorCount = 0;
const MAX_NETWORK_ERRORS = 3;

// Monitor network status and handle offline mode
export async function checkNetworkStatus(): Promise<boolean> {
  try {
    // Try a simple read operation to check connectivity
    const testDoc = doc(db, "_health", "ping");
    await getDoc(testDoc);
    isOnline = true;
    networkErrorCount = 0;
    return true;
  } catch (error: any) {
    networkErrorCount++;
    isOnline = false;
    console.warn(
      `[Firestore] Network check failed (${networkErrorCount}/${MAX_NETWORK_ERRORS}):`,
      error.message,
    );

    // If we've had multiple failures, disable network to reduce errors
    if (networkErrorCount >= MAX_NETWORK_ERRORS) {
      try {
        await disableNetwork(db);
        console.log("[Firestore] Network disabled due to repeated failures");
      } catch (disableError) {
        console.warn("[Firestore] Failed to disable network:", disableError);
      }
    }
    return false;
  }
}

// Try to re-enable network when coming back online
export async function tryReconnect(): Promise<boolean> {
  if (!isOnline) {
    try {
      await enableNetwork(db);
      const success = await checkNetworkStatus();
      if (success) {
        console.log("[Firestore] Successfully reconnected");
        return true;
      }
    } catch (error) {
      console.warn("[Firestore] Failed to reconnect:", error);
    }
  }
  return false;
}

// Wrapper for Firestore operations with retry logic
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 2,
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      console.warn(
        `[Firestore] Operation failed (attempt ${attempt + 1}/${maxRetries + 1}):`,
        error.message,
      );

      // If it's a network error and we have retries left, wait and try again
      if (
        error.code === "unavailable" ||
        (error.code === "timeout" && attempt < maxRetries)
      ) {
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * (attempt + 1)),
        );
        continue;
      }

      // If it's the last attempt or not a network error, throw
      throw error;
    }
  }

  throw new Error("Operation failed after all retries");
}

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

export type PackageType = "shopee" | "mercado_livre" | "avulso";

export interface PackageRecord {
  code: string;
  type: PackageType;
  assignedDriverId: string;
  status?: "pending" | "scanned" | "delivered";
  createdAt?: any; // Firestore timestamp
  scannedAt?: any;
}

// low-level fetch
export async function fetchDrivers(): Promise<Driver[]> {
  return withRetry(async () => {
    const col = collection(db, "drivers");
    const snap = await getDocs(query(col, where("active", "==", true)));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  });
}

// caching helpers (used for offline / fast startup)
const DRIVERS_CACHE_KEY = "drivers_cache";

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

  // Try to refresh in background, but don't fail if offline
  fetchDrivers()
    .then((d) => {
      cacheDrivers(d);
      // If we were offline and now got data, try to reconnect
      if (!isOnline && d.length > 0) {
        tryReconnect();
      }
    })
    .catch((error) => {
      console.warn(
        "[Firestore] Background refresh failed, using cache:",
        error.message,
      );
      checkNetworkStatus(); // Update network status
    });

  if (cached.length) {
    return cached;
  }

  // If no cache, try fresh with retry
  try {
    const fresh = await fetchDrivers();
    await cacheDrivers(fresh);
    return fresh;
  } catch (error) {
    console.error("[Firestore] No cache and fresh fetch failed:", error);
    throw error;
  }
}

// fetch operators (similar)
export async function fetchOperators(): Promise<Operator[]> {
  return withRetry(async () => {
    const col = collection(db, "operators");
    const snap = await getDocs(query(col, where("active", "==", true)));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  });
}

// fetch packages that belong to a driver
export async function fetchPackagesForDriver(
  driverId: string,
): Promise<PackageRecord[]> {
  return withRetry(async () => {
    const col = collection(db, "packages");
    const q = query(col, where("assignedDriverId", "==", driverId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  });
}

// cache for packages per driver
async function cachePackages(driverId: string, pkgs: PackageRecord[]) {
  try {
    await SecureStore.setItemAsync(
      `${PACKAGES_CACHE_PREFIX}${driverId}`,
      JSON.stringify(pkgs),
    );
  } catch {}
}

const PACKAGES_CACHE_PREFIX = "packages_cache_";

export async function getCachedPackages(
  driverId: string,
): Promise<PackageRecord[]> {
  try {
    const raw = await SecureStore.getItemAsync(
      `${PACKAGES_CACHE_PREFIX}${driverId}`,
    );
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function fetchPackagesForDriverWithCache(
  driverId: string,
): Promise<PackageRecord[]> {
  const cached = await getCachedPackages(driverId);
  fetchPackagesForDriver(driverId)
    .then((p) => cachePackages(driverId, p))
    .catch(() => {});
  if (cached.length) {
    return cached;
  }
  const fresh = await fetchPackagesForDriver(driverId);
  await cachePackages(driverId, fresh);
  return fresh;
}

// mark a package as scanned (with optional extra data)
export async function markPackageScanned(
  packageCode: string,
  driverId: string,
) {
  return withRetry(async () => {
    const col = collection(db, "packages");
    const q = query(col, where("code", "==", packageCode));
    const snap = await getDocs(q);
    if (snap.empty) {
      throw new Error("package-not-found");
    }
    const docRef = snap.docs[0].ref;
    await updateDoc(docRef, {
      status: "scanned",
      scannedAt: serverTimestamp(),
    });
  });
}

// create / update an operator or driver (used by admin screens)
export async function upsertDriver(driver: Partial<Driver> & { id?: string }) {
  if (driver.id) {
    const ref = doc(db, "drivers", driver.id);
    await setDoc(ref, driver, { merge: true });
    return driver.id;
  }
  const ref = await addDoc(collection(db, "drivers"), driver);
  return ref.id;
}

// soft delete driver (mark as inactive)
export async function deleteDriver(driverId: string) {
  const ref = doc(db, "drivers", driverId);
  await updateDoc(ref, { active: false });
  // refresh cache
  const updated = await fetchDrivers();
  await cacheDrivers(updated);
}

// --------------------------------------------------
// AUTH helpers (firestore authentication is optional)
// --------------------------------------------------

export function onAuthStateChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function loginOperator(
  email: string,
  password: string,
): Promise<User> {
  const res = await signInWithEmailAndPassword(auth, email, password);
  return res.user;
}

export async function logout(): Promise<void> {
  await signOut(auth);
}

// --- Network Status Utilities ---
export { isOnline };

// Initialize network monitoring
checkNetworkStatus().catch(() => {
  console.log(
    "[Firestore] Initial network check failed, starting in offline mode",
  );
});

// ...add more helpers as needed (sessions, counts, etc.)
