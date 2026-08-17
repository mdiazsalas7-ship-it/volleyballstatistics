"use client";

import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import app, { db, firebaseReady } from "./firebase";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

// Registra el service worker de mensajería pasándole la config por parámetros.
export async function registerMessagingSW() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
  if (!firebaseReady) return null;
  const qs = new URLSearchParams(config).toString();
  try {
    return await navigator.serviceWorker.register(`/firebase-messaging-sw.js?${qs}`);
  } catch (e) {
    console.error("[SW] No se pudo registrar:", e);
    return null;
  }
}

let _messaging = null;
async function getMessagingInstance() {
  if (typeof window === "undefined" || !app) return null;
  const supported = await isSupported().catch(() => false);
  if (!supported) return null;
  if (!_messaging) _messaging = getMessaging(app);
  return _messaging;
}

// Pide permiso, obtiene el token y lo guarda en Firestore.
export async function enableNotifications(uid) {
  if (!firebaseReady) throw new Error("Firebase no está configurado.");
  if (typeof Notification === "undefined") throw new Error("Este dispositivo no soporta notificaciones.");
  if (!VAPID_KEY) throw new Error("Falta la clave VAPID (NEXT_PUBLIC_FIREBASE_VAPID_KEY).");

  const messaging = await getMessagingInstance();
  if (!messaging) throw new Error("Tu navegador no soporta notificaciones push. En iPhone, instalá primero la app en la pantalla de inicio.");

  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("No diste permiso para las notificaciones.");

  const reg = (await registerMessagingSW()) || (await navigator.serviceWorker.ready);
  const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: reg });
  if (!token) throw new Error("No se pudo generar el token de notificaciones.");

  if (db) {
    await setDoc(doc(db, "fcmTokens", token), {
      token,
      uid: uid || null,
      userAgent: navigator.userAgent,
      createdAt: serverTimestamp(),
    });
  }
  return token;
}

// Notificaciones cuando la app está abierta (primer plano).
export async function listenForeground(cb) {
  const messaging = await getMessagingInstance();
  if (!messaging) return () => {};
  return onMessage(messaging, cb);
}

// Envía un aviso a todos los dispositivos (solo admin). Usa la API del servidor.
export async function sendBroadcast(user, title, body) {
  if (!user) throw new Error("Necesitás iniciar sesión.");
  const idToken = await user.getIdToken();
  const res = await fetch("/api/notify", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ title, body }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "No se pudo enviar la notificación.");
  return data;
}
