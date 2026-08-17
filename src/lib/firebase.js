import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// La config web de Firebase es pública por diseño. La seguridad la dan las
// Reglas de Firestore. Se lee de variables de entorno (cargarlas en Vercel).
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// ¿Están las variables de entorno cargadas?
export const firebaseReady = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId
);

const isClient = typeof window !== "undefined";

let app = null;
let db = null;
let auth = null;
let storage = null;

// Solo inicializamos en el navegador y solo si hay configuración válida.
// Envuelto en try/catch para que un error de config NUNCA rompa la página.
if (isClient && firebaseReady) {
  try {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);
  } catch (e) {
    console.error("[Firebase] No se pudo inicializar:", e);
  }
} else if (isClient && !firebaseReady) {
  console.error(
    "[Firebase] Faltan las variables de entorno NEXT_PUBLIC_FIREBASE_*. " +
      "Cargalas en Vercel (Settings -> Environment Variables) y volvé a desplegar."
  );
}

export { db, auth, storage };
export default app;
