// src/config/firebaseConfig.ts
import Constants from "expo-constants";

/**
 * Firebase configuration object with real credentials
 * Values are loaded from environment variables (EXPO_PUBLIC_FIREBASE_*) or app.json
 */

function getExpoValue(key: string): string | undefined {
  const config: any = Constants.expoConfig || Constants.manifest || {};
  const extra = config.extra || {};
  if (!extra[key]) {
    try {
      const appJson = require("../../app.json");
      if (appJson.expo && appJson.expo.extra) {
        return appJson.expo.extra[key];
      }
    } catch {
      // ignore
    }
  }
  return extra[key] as string | undefined;
}

export const FIREBASE_CONFIG = {
  apiKey:
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY ||
    getExpoValue("firebaseApiKey") ||
    "AIzaSyAqS_rWdY5yhXwBLXL48Nooc-xfHpi5f5c",
  authDomain:
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    getExpoValue("firebaseAuthDomain") ||
    "beepvelozz.firebaseapp.com",
  projectId:
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ||
    getExpoValue("firebaseProjectId") ||
    "beepvelozz",
  storageBucket:
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    getExpoValue("firebaseStorageBucket") ||
    "beepvelozz.firebasestorage.app",
  messagingSenderId:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
    getExpoValue("firebaseMessagingSenderId") ||
    "418888118827",
  appId:
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID ||
    getExpoValue("firebaseAppId") ||
    "1:418888118827:web:155021bed2f6cf095c706e",
  measurementId:
    process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID ||
    getExpoValue("firebaseMeasurementId") ||
    "G-PVB66RW3B7",
};

/**
 * Validates Firebase configuration
 * Throws error if required keys are missing
 */
export function validateFirebaseConfig(cfg: Record<string, any> = FIREBASE_CONFIG): void {
  const required = [
    "apiKey",
    "authDomain",
    "projectId",
    "storageBucket",
    "messagingSenderId",
    "appId",
  ];
  const missing = required.filter((key) => !cfg[key]);

  if (missing.length > 0) {
    throw new Error(
      `❌ Missing Firebase configuration: ${missing.join(", ")}. ` +
        `Set EXPO_PUBLIC_FIREBASE_<KEY> environment variables or configure in app.json.`
    );
  }
}
