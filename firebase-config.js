// Firebase Configuration
// IMPORTANT: Replace these values with your actual Firebase project credentials
// Get these from: Firebase Console > Project Settings > General > Your apps > Web app

const firebaseConfig = {
    apiKey: "AIzaSyDZNyLrdvIMmowQroZ0w60aH6qSot0hqXY",
    authDomain: "group-fund-tracker.firebaseapp.com",
    projectId: "group-fund-tracker",
    storageBucket: "group-fund-tracker.firebasestorage.app",
    messagingSenderId: "295603719770",
    appId: "1:295603719770:web:4c89e877ee673d112bd263"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// Export for use in other files
window.auth = auth;
window.db = db;

console.log('Firebase initialized successfully');
