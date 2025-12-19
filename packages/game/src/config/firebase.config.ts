import type { FirebaseConfig } from '../network/firebase';

/**
 * Firebase Configuration
 * 
 * Get these values from Firebase Console:
 * 1. Go to https://console.firebase.google.com/
 * 2. Create or select your project
 * 3. Go to Project Settings > General
 * 4. Scroll down to "Your apps" and select/add a Web app
 * 5. Copy the config object
 * 
 * IMPORTANT: Enable Realtime Database in Firebase Console:
 * - Build > Realtime Database > Create Database
 * - Choose a region
 * - Start in test mode for development
 */

export const firebaseConfig: FirebaseConfig = {
    apiKey: "AIzaSyDc7DCEMUUvrGmRtaQvNtQjx__HcaGu7Sw",
    authDomain: "skirmish-9de79.firebaseapp.com",
    databaseURL: "https://skirmish-9de79-default-rtdb.firebaseio.com",
    projectId: "skirmish-9de79",
    storageBucket: "skirmish-9de79.firebasestorage.app",
    messagingSenderId: "191233121530",
    appId: "1:191233121530:web:fd7901c82ff5d794f4bd43"
};

// Set this to true when you've configured Firebase
export const FIREBASE_CONFIGURED = true;

