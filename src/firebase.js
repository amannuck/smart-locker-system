// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBwaqbfPVmUX2emoiGPIr10K6fyshMr5PM",
  authDomain: "soen-422-project-d59a7.firebaseapp.com",
  databaseURL: "https://soen-422-project-d59a7-default-rtdb.firebaseio.com",
  projectId: "soen-422-project-d59a7",
  storageBucket: "soen-422-project-d59a7.firebasestorage.app",
  messagingSenderId: "1029834717215",
  appId: "1:1029834717215:web:06ba4ed70397d11690fd2a",
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

export { db };
