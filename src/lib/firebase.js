import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// La configuración web de Firebase es pública por diseño (identifica el
// proyecto, no da acceso). La seguridad real la dan las Reglas de Firestore
// y App Check. Aun así la leemos de variables de entorno para no fijarla en
// el repositorio. Deben cargarse en Vercel (Settings -> Environment Variables).
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Firebase se inicializa SOLO en el navegador. Durante el build/prerender en
// el servidor, db y auth valen null y no se usan (todas las llamadas ocurren
// dentro de useEffect o manejadores de eventos, que corren en el cliente).
const isClient = typeof window !== "undefined";
const app = isClient ? (getApps().length ? getApp() : initializeApp(firebaseConfig)) : null;

export const db = app ? getFirestore(app) : null;
export const auth = app ? getAuth(app) : null;
export default app;
