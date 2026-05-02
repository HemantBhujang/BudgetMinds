// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD66rxt-HhK7KIiduhSP5AVWaALpFSv5_w",
  authDomain: "budgetminds-7cbbc.firebaseapp.com",
  projectId: "budgetminds-7cbbc",
  storageBucket: "budgetminds-7cbbc.firebasestorage.app",
  messagingSenderId: "546651685315",
  appId: "1:546651685315:web:bb1be12fc01355dc0ffd76",
  measurementId: "G-6HGX7VD26C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);