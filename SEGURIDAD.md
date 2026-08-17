# 🔒 Seguridad de la app

## ¿Está expuesta mi base de datos? No.
Lo que aparece en la configuración de Firebase (`apiKey`, `projectId`, etc.)
**es público por diseño**. No es una contraseña: solo identifica tu proyecto
ante Google, igual que la dirección de una casa no abre la puerta.

Según la documentación oficial de Firebase, las API keys **no** controlan el
acceso a tus datos; eso lo hacen las **Reglas de Seguridad** y **App Check**.
Aunque alguien copie tu `apiKey`, no puede leer ni escribir nada si las reglas
están bien puestas (y lo están).

Referencia: https://firebase.google.com/docs/projects/api-keys

## Qué protege de verdad tus datos (ya configurado)
- **Reglas de Firestore** (`firestore.rules`):
  - Lectura pública del contenido del torneo (para los visitantes).
  - Escritura **solo para administradores**.
  - Un usuario nuevo se crea siempre como `visitor`; nadie puede auto-asignarse `admin`.
  - Bloqueo por defecto de cualquier ruta no contemplada.
- **En el repositorio no queda ninguna clave**: la config se lee de variables de
  entorno y `.env.local` está en `.gitignore`.

## Endurecimiento recomendado (5 minutos, opcional pero aconsejable)

### 1. Restringir la API key a tus dominios
Google Cloud Console → APIs y servicios → Credenciales → tu "Browser key" →
**Application restrictions → HTTP referrers**, y agregá:
```
https://TU-DOMINIO.vercel.app/*
http://localhost:3000/*
```
Así, aunque la clave sea pública, solo funciona desde tu app.

### 2. Activar App Check (recomendado)
Firebase Console → **App Check** → registrá tu app web con **reCAPTCHA v3**.
Esto garantiza que solo tu aplicación (y no scripts externos) pueda pegarle a
Firestore y Auth. Es la capa que "cierra" el acceso a nivel de app.

### 3. Monitoreo
Firebase Console → **Usage and billing** → configurá alertas de uso para
enterarte de cualquier actividad anómala.

## Checklist antes de publicar
- [ ] Variables de entorno cargadas en Vercel (ver `DEPLOY-VERCEL.md`).
- [ ] Reglas de `firestore.rules` publicadas en Firebase.
- [ ] Tu dominio de Vercel agregado en Authentication → Authorized domains.
- [ ] Tu usuario con `role: "admin"` en `users/{uid}`.
- [ ] (Opcional) API key restringida por dominio.
- [ ] (Opcional) App Check activado.

## Nota sobre dependencias
El proyecto usa la última versión parcheada de **Next.js 14.2.x** y la última de
**Firebase**. Quedan un par de avisos de auditoría de tipo *DoS* (disponibilidad,
no exposición de datos) que solo se resuelven saltando a Next.js 16, un cambio
mayor que conviene hacer con calma y pruebas más adelante. En Vercel, esas rutas
de ataque están en buena parte mitigadas por la plataforma.

---

## Etapa 2: notificaciones — nota de seguridad importante
A diferencia de la config web (que es pública), la **cuenta de servicio**
(`FIREBASE_SERVICE_ACCOUNT_B64`) **es un secreto real**. Con ella se puede
administrar tu proyecto. Por eso:
- **NUNCA** lleva el prefijo `NEXT_PUBLIC` (así nunca llega al navegador).
- Solo se usa en el servidor, dentro de `/api/notify`.
- No la subas al repositorio (va únicamente en variables de entorno de Vercel).
- Si alguna vez se filtra, revocala en Firebase → Cuentas de servicio y generá otra.

El envío de avisos está protegido: la API verifica el token de identidad del
usuario y que su rol sea `admin` antes de enviar nada. Los tokens de dispositivos
(`fcmTokens`) no se pueden leer desde el cliente; solo el servidor los usa.
