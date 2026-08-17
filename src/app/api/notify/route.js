import { NextResponse } from "next/server";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Inicializa Firebase Admin con la cuenta de servicio (secreto del servidor).
function ensureAdmin() {
  if (getApps().length) return;
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
  if (!b64) throw new Error("Falta FIREBASE_SERVICE_ACCOUNT_B64 en las variables de entorno.");
  const serviceAccount = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
  initializeApp({ credential: cert(serviceAccount) });
}

export async function POST(req) {
  try {
    ensureAdmin();

    // 1) Verificar identidad
    const authHeader = req.headers.get("authorization") || "";
    const idToken = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!idToken) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

    const decoded = await getAuth().verifyIdToken(idToken);

    // 2) Verificar que sea admin
    const userSnap = await getFirestore().doc(`users/${decoded.uid}`).get();
    if (!userSnap.exists || userSnap.data().role !== "admin") {
      return NextResponse.json({ error: "Solo un administrador puede enviar avisos." }, { status: 403 });
    }

    // 3) Datos del aviso
    const { title, body } = await req.json();
    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Falta el título del aviso." }, { status: 400 });
    }

    // 4) Juntar los tokens registrados
    const tokensSnap = await getFirestore().collection("fcmTokens").get();
    const tokens = tokensSnap.docs.map((d) => d.data().token).filter(Boolean);
    if (tokens.length === 0) return NextResponse.json({ sent: 0, failed: 0 });

    // 5) Enviar (en lotes de 500, límite de FCM)
    const messaging = getMessaging();
    let sent = 0;
    let failed = 0;
    const invalid = [];

    for (let i = 0; i < tokens.length; i += 500) {
      const batch = tokens.slice(i, i + 500);
      const res = await messaging.sendEachForMulticast({
        tokens: batch,
        notification: { title: title.trim(), body: (body || "").trim() },
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
          ) {
            invalid.push(batch[idx]);
          }
        }
      });
    }

    // 6) Limpiar tokens inválidos
    await Promise.all(
      invalid.map((t) => getFirestore().doc(`fcmTokens/${t}`).delete().catch(() => {}))
    );

    return NextResponse.json({ sent, failed });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Error interno." }, { status: 500 });
  }
}
