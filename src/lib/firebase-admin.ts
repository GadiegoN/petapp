import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

const isConfigured = 
  process.env.FIREBASE_CLIENT_EMAIL && 
  process.env.FIREBASE_PRIVATE_KEY && 
  !process.env.FIREBASE_PRIVATE_KEY.includes("YOUR_PRIVATE_KEY_HERE");

if (isConfigured && getApps().length === 0) {
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/^["']|["']$/g, "").replace(/\\n/g, "\n"),
      }),
    });
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
  }
}

export const getAdminDb = () => {
  if (getApps().length === 0) {
    throw new Error("Firebase Admin SDK is not initialized. Please configure your environment variables.");
  }
  return getFirestore();
};

export const getAdminAuth = () => {
  if (getApps().length === 0) {
    throw new Error("Firebase Admin SDK is not initialized. Please configure your environment variables.");
  }
  return getAuth();
};


