# 🚀 Desplegar en Vercel — pasos exactos

## ⚠️ Por qué falló tu deploy
El archivo `.env.local` **NO se sube a Vercel** (está en `.gitignore`, y así debe ser).
Vercel no tenía las variables de Firebase, entonces el build falló con
`auth/invalid-api-key`. La solución es cargar esas variables en el panel de Vercel.

> Además, ya cambié el código para que Firebase se inicialice solo en el navegador,
> así el build nunca vuelve a romperse por esto aunque falte alguna variable.

## 1. Cargar las variables en Vercel
En tu proyecto de Vercel: **Settings → Environment Variables**.
Agregá estas 6 (Environment: **Production**, **Preview** y **Development**):

```
NEXT_PUBLIC_FIREBASE_API_KEY            = AIzaSyBjqJqZcZ2aoYHyKPE2kN9bjQI5eCTrI7c
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN        = volleyball-statistics-af074.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID         = volleyball-statistics-af074
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET     = volleyball-statistics-af074.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID= 226672871324
NEXT_PUBLIC_FIREBASE_APP_ID             = 1:226672871324:web:33dcd84832724d5f136a59
```

## 2. Volver a desplegar
En Vercel: pestaña **Deployments → ⋯ (menú) → Redeploy**.
(O hacé un nuevo `git push`; Vercel despliega solo.)

## 3. Autorizar el dominio en Firebase
Cuando tengas la URL de Vercel (ej. `tuapp.vercel.app`):
Firebase Console → **Authentication → Settings → Authorized domains → Add domain**
y agregá tu dominio de Vercel. Sin esto, el login falla en producción.

## 4. Publicar las reglas de seguridad
Firebase Console → **Firestore Database → Rules** → pegá el contenido de
`firestore.rules` de este proyecto → **Publish**.

---

Cuando termines estos 4 pasos, la app queda funcionando en tu URL de Vercel.
