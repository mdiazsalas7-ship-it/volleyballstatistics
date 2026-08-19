import { NextResponse } from "next/server";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Límite: máximo 5 avisos por minuto por administrador.
const WINDOW_MS = 60_000;
const MAX_IN_WINDOW = 5;
const MAX_TITLE = 120;
const MAX_BODY = 500;

function ensureAdmin() {
  if (getApps().length) return;
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
  if (!b64) throw new Error("Falta FIREBASE_SERVICE_ACCOUNT_B64 en las variables de entorno.");
  const serviceAccount = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
  initializeApp({ credential: cert(serviceAccount) });
}

// Rate limiting con Firestore (transacción para evitar carreras).
async function checkRateLimit(uid) {
  const db = getFirestore();
  const ref = db.doc(`rateLimits/notify_${uid}`);
  const now = Date.now();
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    let times = snap.exists ? snap.data().times || [] : [];
    times = times.filter((t) => now - t < WINDOW_MS); // solo los de la última ventana
    if (times.length >= MAX_IN_WINDOW) {
      const retry = Math.ceil((WINDOW_MS - (now - times[0])) / 1000);
      return { ok: false, retry };
    }
    times.push(now);
    tx.set(ref, { times, updatedAt: now }, { merge: true });
    return { ok: true };
  });
}

export async function POST(req) {
  try {
    ensureAdmin();

    // 1) Identidad
    const authHeader = req.headers.get("authorization") || "";
    const idToken = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!idToken) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    const decoded = await getAuth().verifyIdToken(idToken);

    // 2) Rol admin
    const userSnap = await getFirestore().doc(`users/${decoded.uid}`).get();
    if (!userSnap.exists || userSnap.data().role !== "admin") {
      return NextResponse.json({ error: "Solo un administrador puede enviar avisos." }, { status: 403 });
    }

    // 3) Rate limit (5 por minuto por admin)
    const rl = await checkRateLimit(decoded.uid);
    if (!rl.ok) {
      return NextResponse.json(
        { error: `Demasiados avisos seguidos. Esperá ${rl.retry}s e intentá de nuevo.` },
        { status: 429 }
      );
    }

    // 4) Validar entrada
    const bodyJson = await req.json().catch(() => ({}));
    const title = (bodyJson.title || "").toString().trim();
    const body = (bodyJson.body || "").toString().trim();
    if (!title) return NextResponse.json({ error: "Falta el título del aviso." }, { status: 400 });
    if (title.length > MAX_TITLE) return NextResponse.json({ error: `El título no puede superar ${MAX_TITLE} caracteres.` }, { status: 400 });
    if (body.length > MAX_BODY) return NextResponse.json({ error: `El mensaje no puede superar ${MAX_BODY} caracteres.` }, { status: 400 });

    // 5) Tokens
    const tokensSnap = await getFirestore().collection("fcmTokens").get();
    const tokens = tokensSnap.docs.map((d) => d.data().token).filter(Boolean);
    if (tokens.length === 0) return NextResponse.json({ sent: 0, failed: 0 });

    // 6) Enviar en lotes de 500
    const messaging = getMessaging();
    let sent = 0, failed = 0;
    const invalid = [];
    for (let i = 0; i < tokens.length; i += 500) {
      const batch = tokens.slice(i, i + 500);
      const res = await messaging.sendEachForMulticast({
        tokens: batch,
        notification: { title, body },
      });
      sent += res.successCount;
      failed += res.failureCount;
      res.responses.forEach((r, idx) => {
        if (!r.success) {
          const code = r.error?.code || "";
          if (
            code.includes("registration-token-not-registered") ||
            code.includes("invalid-registration-token") ||
            code.includes("invalid-argument")
          ) invalid.push(batch[idx]);
        }
      });
    }

    // 7) Limpiar tokens inválidos
    await Promise.all(invalid.map((t) => getFirestore().doc(`fcmTokens/${t}`).delete().catch(() => {})));

    return NextResponse.json({ sent, failed });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Error interno." }, { status: 500 });
  }
}
