import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

// Firebase Admin singleton instance
let app: App | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

/**
 * Initialize Firebase Admin SDK
 * Uses environment variables for configuration
 * Implements singleton pattern to prevent multiple initializations
 */
function initializeFirebaseAdmin(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  // Parse the service account from environment variable
  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}'
  );

  return initializeApp({
    credential: cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

/**
 * Get Firebase Admin App instance
 */
export function getFirebaseApp(): App {
  if (!app) {
    app = initializeFirebaseAdmin();
  }
  return app;
}

/**
 * Get Firebase Auth instance
 */
export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
  }
  return auth;
}

/**
 * Get Firestore instance
 */
export function getFirestoreDb(): Firestore {
  if (!db) {
    db = getFirestore(getFirebaseApp());
  }
  return db;
}

// Collection names as constants for consistency
export const COLLECTIONS = {
  USERS: 'users',
  AGENCIES: 'agencies',
} as const;
