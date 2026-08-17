# 🔔 Etapa 2 — Configurar notificaciones push e instalación

La instalación en el celular (PWA) **ya funciona sin configurar nada**: entrá a la
app → pestaña **Cuenta** → **Instalar app**.

Las **notificaciones push** necesitan dos datos extra de Firebase. Sin ellos, la
app sigue funcionando igual; solo el botón de notificaciones avisará que faltan.

## 1. Clave VAPID (pública)
Firebase Console → ⚙️ **Configuración del proyecto** → pestaña **Cloud Messaging**
→ sección **Certificados push web** → **Generar par de claves**.
Copiá la clave que aparece (empieza con `B...`) y guardala como variable:

```
NEXT_PUBLIC_FIREBASE_VAPID_KEY = <la clave que copiaste>
```

## 2. Cuenta de servicio (SECRETA — solo servidor)
Esta sí es privada; permite al servidor enviar las notificaciones.

1. Firebase Console → ⚙️ **Configuración del proyecto** → pestaña **Cuentas de servicio**.
2. **Generar nueva clave privada** → descarga un archivo `.json`.
3. Convertí ese `.json` a **base64** (una sola línea):
   - **Mac/Linux:** `base64 -i serviceAccount.json | tr -d '\n'`
   - **Windows (PowerShell):**
     `[Convert]::ToBase64String([IO.File]::ReadAllBytes("serviceAccount.json"))`
   - **Sin terminal:** usá un convertidor "file to base64" online (o pedímelo y te digo cómo).
4. Guardá el resultado como variable (⚠️ **sin** el prefijo `NEXT_PUBLIC`):

```
FIREBASE_SERVICE_ACCOUNT_B64 = <el texto base64 larguísimo>
```

## 3. Cargar las dos variables en Vercel
Vercel → tu proyecto → **Settings → Environment Variables** → agregá:
- `NEXT_PUBLIC_FIREBASE_VAPID_KEY`
- `FIREBASE_SERVICE_ACCOUNT_B64`

Luego **Deployments → ⋯ → Redeploy**.

## 4. Habilitar Cloud Messaging API
La primera vez, Firebase suele pedir habilitar la API. Si al enviar un aviso ves
un error de permisos, entrá a Google Cloud Console → APIs → habilitá
**Firebase Cloud Messaging API (V1)** para tu proyecto.

## Cómo se usa
- **Cualquier persona**: Cuenta → **Activar notificaciones** (da permiso en el navegador).
- **Admin**: Cuenta → **Enviar aviso a todos** (título + mensaje).
- **Automático**: cuando el admin toca **Iniciar partido** en la Mesa técnica, se
  envía un aviso "¡Empezó el partido!" a todos los suscriptos.

## Importante sobre iPhone
En iOS, las notificaciones web **solo funcionan si la app está instalada** en la
pantalla de inicio (iOS 16.4+). Primero instalá, después activá notificaciones.
