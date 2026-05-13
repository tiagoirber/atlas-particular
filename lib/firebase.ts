import { getApps, getApp, initializeApp, type FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (typeof window !== "undefined") {
  const missing = (
    [
      ["apiKey", firebaseConfig.apiKey],
      ["authDomain", firebaseConfig.authDomain],
      ["projectId", firebaseConfig.projectId],
      ["storageBucket", firebaseConfig.storageBucket],
      ["appId", firebaseConfig.appId],
    ] as const
  ).filter(([, v]) => !v).map(([k]) => k);

  if (missing.length) {
    console.warn(
      `[firebase] Variáveis ausentes em .env.local: ${missing.join(", ")}. ` +
        `Configure-as antes de usar autenticação ou Firestore.`,
    );
  }
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const storage = getStorage(app);
