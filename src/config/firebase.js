import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyDunPAqFJvk-xpcjWykW_L4yKKItTPiLzU',
  authDomain: 'tasarimhane-2c03b.firebaseapp.com',
  projectId: 'tasarimhane-2c03b',
  storageBucket: 'tasarimhane-2c03b.firebasestorage.app',
  messagingSenderId: '541303114598',
  appId: '1:541303114598:android:74f255d9457b7dab9616a7',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
