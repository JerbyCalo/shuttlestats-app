// Firebase Configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Your Firebase config object (you'll get this from Firebase Console)
const firebaseConfig = {
  // TODO: Replace with your actual Firebase config
  apiKey: "AIzaSyBqcM5EET1wzzVYMughJts3H2HtG4PZP3A",
  authDomain: "shuttlestats-app.firebaseapp.com",
  projectId: "shuttlestats-app",
  storageBucket: "shuttlestats-app.firebasestorage.app",
  messagingSenderId: "534050399041",
  appId: "1:534050399041:web:f2ab69f55bac35681f37c0",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);

// Export the app for other uses
export default app;
