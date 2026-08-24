import { Platform } from "react-native";

import {
  initializeApp,
  getApps,
  getApp,
} from "firebase/app";

import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
} from "firebase/auth";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getStorage } from "firebase/storage";

function normalizeEnvValue(value) {
  return value?.trim().replace(/,$/, "").replace(/^["']|["']$/g, "");
}

const firebaseConfig = {
  apiKey: normalizeEnvValue(process.env.EXPO_PUBLIC_FIREBASE_API_KEY),
  authDomain: normalizeEnvValue(process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: normalizeEnvValue(process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: normalizeEnvValue(
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
  ),
  messagingSenderId: normalizeEnvValue(
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  ),
  appId: normalizeEnvValue(process.env.EXPO_PUBLIC_FIREBASE_APP_ID),
  measurementId: normalizeEnvValue(
    process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
  ),
};

const requiredFirebaseConfig = {
  EXPO_PUBLIC_FIREBASE_API_KEY: firebaseConfig.apiKey,
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: firebaseConfig.authDomain,
  EXPO_PUBLIC_FIREBASE_PROJECT_ID: firebaseConfig.projectId,
  EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: firebaseConfig.storageBucket,
  EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: firebaseConfig.messagingSenderId,
  EXPO_PUBLIC_FIREBASE_APP_ID: firebaseConfig.appId,
};

const missingFirebaseConfig = Object.entries(requiredFirebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingFirebaseConfig.length > 0) {
  throw new Error(
    `Missing Firebase environment variables: ${missingFirebaseConfig.join(
      ", "
    )}`
  );
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
let auth;

if (Platform.OS === "web") {
  auth = getAuth(app);
} else {
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    if (error?.code !== "auth/already-initialized") {
      throw error;
    }

    console.log("Firebase auth already initialized; using existing instance.");
    auth = getAuth(app);
  }
}

const db = getFirestore(app);
const cloudFunctions = getFunctions(app);
const storage = getStorage(app);

export { auth, cloudFunctions, db, storage };
