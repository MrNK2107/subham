import type { FirebaseApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";

// Firebase web config is public by design; access is enforced by firestore.rules.
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/** Sign-in and sync are offered only when Firebase is configured. */
export const firebaseEnabled = Boolean(config.apiKey && config.projectId && config.appId);

export interface FirebaseHandles {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}

let loading: Promise<FirebaseHandles | null> | undefined;

/** Loads the Firebase SDK on first use, so pages that never sign in never download it. */
export function getFirebase(): Promise<FirebaseHandles | null> {
  if (!firebaseEnabled) return Promise.resolve(null);
  loading ??= (async () => {
    const [{ initializeApp }, { getAuth }, { getFirestore }] = await Promise.all([
      import("firebase/app"),
      import("firebase/auth"),
      import("firebase/firestore"),
    ]);
    const app = initializeApp(config);
    return { app, auth: getAuth(app), db: getFirestore(app) };
  })();
  return loading;
}
