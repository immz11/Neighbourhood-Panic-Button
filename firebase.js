// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyBKbHxL2uAMvNm8C_782S5c40F5FpFWr6M",
    authDomain: "neighborhood-alert-7e7b8.firebaseapp.com",
    projectId: "neighborhood-alert-7e7b8",
    storageBucket: "neighborhood-alert-7e7b8.firebasestorage.app",
    messagingSenderId: "266920458474",
    appId: "1:266920458474:web:02641bd8339961857c3f93",
    measurementId: "G-YR720ESG5Y"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and export
export const auth = getAuth(app);

