// @ts-ignore
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, User } from "firebase/auth";
import firebaseConfig from "../firebase-applet-config.json";

// Initialize Firebase (Singleton pattern)
export const app = (getApps && getApps().length) ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with offline persistence
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  }),
  experimentalForceLongPolling: true, // Force long polling to bypass proxy/firewall issues
}, (firebaseConfig as any).firestoreDatabaseId); /* CRITICAL: Must use the specific firestoreDatabaseId from the configuration */

// Initialize Auth
export const auth = getAuth(app);

// Initialize Analytics safely (async)
export const analyticsPromise = isSupported().then(yes => {
  if (yes) {
    try {
      return getAnalytics(app);
    } catch (err) {
      console.warn("Analytics initialization skipped or failed: ", err);
      return null;
    }
  }
  return null;
}).catch(err => {
  console.warn("Analytics not supported: ", err);
  return null;
});

export { onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword };
export type { User };
