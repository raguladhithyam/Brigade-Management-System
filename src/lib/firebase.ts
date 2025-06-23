// Try Firebase v9+ first, fallback to v8 if needed
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/auth';

const firebaseConfig = {
  apiKey: "AIzaSyC2783FKRWNzhXWvMj9lHPDGs5CpaZfaxc",
  authDomain: "cled-16ada.firebaseapp.com",
  projectId: "cled-16ada",
  storageBucket: "cled-16ada.appspot.com",
  messagingSenderId: "907231652143",
  appId: "1:907231652143:web:042d6cb9a645e7161819da"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const db = firebase.firestore();
export const auth = firebase.auth();
export default firebase;