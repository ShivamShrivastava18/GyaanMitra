import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth"

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCtTa65tWdKWQ668TGQLMMvhFGfivCl-9I",
  authDomain: "gyaanmitra-5d418.firebaseapp.com",
  projectId: "gyaanmitra-5d418",
  storageBucket: "gyaanmitra-5d418.firebasestorage.app",
  messagingSenderId: "306008320829",
  appId: "1:306008320829:web:2e4a4cc41bba62bafb7354",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)

