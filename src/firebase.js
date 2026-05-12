import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyD7C-o_soTr5y7Qq-feAxrz6GHlHupf-DE",
  authDomain: "soufit-4299c.firebaseapp.com",
  projectId: "soufit-4299c",
  storageBucket: "soufit-4299c.firebasestorage.app",
  messagingSenderId: "1096575028557",
  appId: "1:1096575028557:web:81fe4623601a2a358afb04"
}

const app  = initializeApp(firebaseConfig)
export const db   = getFirestore(app)
export const auth = getAuth(app)
