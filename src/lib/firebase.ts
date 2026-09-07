import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';
import firebaseConfig from '../../firebase-applet-config.json';

const isConfigured = !!(firebaseConfig && firebaseConfig.projectId && firebaseConfig.apiKey);

export const app = isConfigured 
  ? (getApps().length > 0 ? getApp() : initializeApp(firebaseConfig))
  : null;

const customDbId = (firebaseConfig as any).firestoreDatabaseId;
export const db = app 
  ? (customDbId && customDbId !== '(default)' ? getFirestore(app, customDbId) : getFirestore(app)) 
  : (null as any);

export const auth = app ? getAuth(app) : (null as any);

export let analytics: any = null;
if (typeof window !== 'undefined' && app && (firebaseConfig as any).measurementId) {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch((err) => {
    console.warn('Firebase Analytics not supported in this environment:', err);
  });
}

