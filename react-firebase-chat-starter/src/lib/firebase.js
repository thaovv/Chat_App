
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: "unichat-3b020.firebaseapp.com",
  projectId: "unichat-3b020",
  storageBucket: "unichat-3b020.firebasestorage.app",
  messagingSenderId: "565432737809",
  appId: "1:565432737809:web:fd7113cc358c40b73011b0"
};


const app = initializeApp(firebaseConfig);

export const auth = getAuth();
export const db = getFirestore();
export const storage = getStorage();