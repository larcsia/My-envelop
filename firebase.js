import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAxtb94eMB5Rmb1ywwFNktm2a9-43fopJY",
  authDomain: "journo-7212.firebaseapp.com",
  projectId: "journo-7212",
  storageBucket: "journo-7212.firebasestorage.app",
  messagingSenderId: "618392873417",
  appId: "1:618392873417:web:02465521f02a5a7d3ea018",
  measurementId: "G-N160J6L1YR"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);