import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer,
  enableMultiTabIndexedDbPersistence,
  setLogLevel
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Silence Firestore internal console spam (backoff warnings & quota logs)
try {
  setLogLevel('silent');
} catch (e) {
  // ignore
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Enable Multi-Tab Offline Persistence for high resilience across multiple browser tabs
if (typeof window !== 'undefined') {
  enableMultiTabIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open without multi-tab persistence support, or persistence disabled
      console.warn('Firestore multi-tab persistence failed-precondition:', err?.message || err);
    } else if (err.code === 'unimplemented') {
      // The current browser does not support all features required to enable persistence
      console.warn('Firestore persistence unimplemented: browser does not support');
    } else {
      console.warn('Firestore persistence initialization notice:', err?.message || err);
    }
  });
}

export let isQuotaExceeded = false;

// Test connection on boot to satisfy validating connection criteria
export async function testFirebaseConnection() {
  try {
    const testDocRef = doc(db, 'test', 'connection');
    await getDocFromServer(testDocRef);
    console.log('Firebase Firestore connection test successful.');
    return true;
  } catch (error: any) {
    if (error?.code === 'resource-exhausted' || error?.message?.includes('resource-exhausted') || error?.message?.includes('Quota limit exceeded')) {
      isQuotaExceeded = true;
      console.warn('Firebase Firestore daily write quota reached. Application is running smoothly via IndexedDB & local persistence.');
    } else if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase is offline. Check network connection or configuration.');
    } else {
      console.warn('Firebase Firestore test connection failed (expected if DB is empty or quota reached):', error?.message || error);
    }
    return false;
  }
}

// Run test connection in browser environment
if (typeof window !== 'undefined') {
  testFirebaseConnection();
}

export { app, auth, db };
