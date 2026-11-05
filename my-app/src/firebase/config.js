import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";


const testConfig = {
  apiKey: "test-api-key",
  authDomain: "test.firebaseapp.com",
  projectId: "test-project",
  storageBucket: "test-project.firebasestorage.app",
  messagingSenderId: "test-sender-id",
  appId: "1:123456789:web:test",
  databaseURL: "https://test-project-default-rtdb.firebaseio.com"
};

const firebaseConfig = process.env.NODE_ENV === "test"
  ? {
      apiKey: process.env.REACT_APP_FIREBASE_API_KEY || testConfig.apiKey,
      authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || testConfig.authDomain,
      projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || testConfig.projectId,
      storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || testConfig.storageBucket,
      messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || testConfig.messagingSenderId,
      appId: process.env.REACT_APP_FIREBASE_APP_ID || testConfig.appId,
      databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
    }
  : {
      apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
      authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
      storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.REACT_APP_FIREBASE_APP_ID
    };

const missingConfig = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingConfig.length > 0) {
  throw new Error(
    `Missing Firebase client configuration: ${missingConfig.join(", ")}`
  );
}

const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const database = getDatabase(app);