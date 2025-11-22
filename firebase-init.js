// Firebase инициализация - единственное место где инициализируется Firebase
import { firebaseConfig } from './firebase-config.js';
import {
    initializeApp
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
import {
    getAuth
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';
import {
    getDatabase
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js';

console.log('[firebase-init] Инициализация Firebase...');

// Инициализировать Firebase один раз
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

console.log('[firebase-init] ✅ Firebase инициализирован');

export { app, auth, database };
