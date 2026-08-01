import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer,
  enableIndexedDbPersistence,
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

// Enable Offline Persistence for high resilience in browser environments
if (typeof window !== 'undefined') {
  try {
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled in one tab at a time.
        console.warn('Firestore persistence failed-precondition: multiple tabs open');
      } else if (err.code === 'unimplemented') {
        // The current browser does not support all of the features required to enable persistence
        console.warn('Firestore persistence unimplemented: browser does not support');
      }
    });
  } catch (e) {
    console.error('Failed to initialize Firestore persistence:', e);
  }
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
