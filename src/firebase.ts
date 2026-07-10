import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
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
const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
const storage = getStorage(app);

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

export let isQuotaExceeded = true; // Permanently disabled Firebase Firestore integration as requested

// Test connection on boot to satisfy validating connection criteria
export async function testFirebaseConnection() {
  console.log('Firebase Firestore is currently disabled. Using offline local storage persistence.');
  return false;
}

// Run test connection in browser environment
if (typeof window !== 'undefined') {
  testFirebaseConnection();
}

export { app, auth, db, storage };
