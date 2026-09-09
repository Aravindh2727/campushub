import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyASdGnIzt7Up42sk3jA5dU3JGCj1J9ahTw",
  authDomain: "a-a--r-d-school-dpm.firebaseapp.com",
  projectId: "a-a--r-d-school-dpm",
  storageBucket: "a-a--r-d-school-dpm.firebasestorage.app",
  messagingSenderId: "354216475135",
  appId: "1:354216475135:web:249d7818a5444e6aef8fca",
  measurementId: "G-VBCHJ4Y9Y9"
};

export let auth = null;
export let storage = null;
export let analytics = null;

if (import.meta.env.VITE_APP_MODE !== 'demo') {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  storage = getStorage(app);
  analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
}
