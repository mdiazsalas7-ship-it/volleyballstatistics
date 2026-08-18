# 🏐 Torneo Voley — App de estadísticas

App de estadísticas para torneos amateur de voleibol. Construida con **Next.js**, **Firebase (Firestore + Auth)** y **Tailwind CSS**. Despliega en **Vercel** y funciona como **PWA** (se instala en el celular).

## ✅ Funciones incluidas
- **Inicio (dashboard)**: resumen con partidos en vivo, carruseles de últimos resultados,
  líderes de la liga, próximos partidos y noticias destacadas.
- **Marca personalizable (white-label)**: el admin cambia el nombre y el logo de la liga
  desde Cuenta → "Marca de la liga"; se refleja al instante en toda la app.
- **Noticias**: módulo donde el admin publica novedades (con imagen) que aparecen en Inicio.
- **Tabla de posiciones** automática (desde los partidos finalizados).
- **Calendario**: el admin programa partidos; todos ven próximos, en vivo y resultados.
- **Estadísticas individuales**: líderes del torneo por categoría.
- **Mesa técnica**: anotador en vivo (marcador por set + estadísticas por jugador). Solo admin.
- **Equipos y roster** con fotos de jugadores (Firebase Storage), gestionado por el admin.
- **Roles**: administrador (gestiona todo) y visitante (solo lectura).
- **PWA**: instalación en el celular + notificaciones push (FCM).

## 🔜 Próximas etapas
- **Etapa 2** ✅ incluida: instalación en el celular (PWA) y notificaciones push (FCM).
  Configuración en `NOTIFICACIONES-SETUP.md`.
- **Etapa 3** ✅ incluida: equipos con roster y fotos de jugadores (gestionado por el
  admin, con Firebase Storage). Configuración en `STORAGE-SETUP.md`.

---

## 1. Requisitos
- Node.js 18 o superior
- Una cuenta de Google (para Firebase) y una de GitHub + Vercel

## 2. Instalar y correr en local
```bash
npm install
cp .env.example .env.local   # y completá los datos de Firebase (paso 3)
npm run dev
```
Abrí http://localhost:3000

## 3. Configurar Firebase
1. Entrá a https://console.firebase.google.com y **creá un proyecto**.
2. En **Compilación → Firestore Database**, creá la base (modo producción).
3. En **Compilación → Authentication → Sign-in method**, activá **Correo electrónico/contraseña**.
4. En **Configuración del proyecto → Tus apps**, agregá una app **Web** y copiá el objeto `firebaseConfig`.
5. Pegá esos valores en `.env.local` (las variables `NEXT_PUBLIC_FIREBASE_*`).
6. En **Firestore → Reglas**, pegá el contenido de `firestore.rules` y publicá.

### Crear tu usuario admin
1. En **Authentication → Users**, creá tu usuario (correo + contraseña).
2. Iniciá sesión una vez en la app (así se crea tu documento en `users/{uid}`).
3. En **Firestore**, abrí `users/{tu-uid}` y cambiá `role` a `admin`.
4. Recargá: ya te aparece la pestaña **Mesa técnica**.

> Para datos de prueba, mirá `seed-datos-ejemplo.md`.

## 4. Subir a GitHub
```bash
git init
git add .
git commit -m "Etapa 1: app de estadísticas de voleibol"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/TU-REPO.git
git push -u origin main
```

## 5. Desplegar en Vercel
1. Entrá a https://vercel.com y **importá el repo** de GitHub.
2. Framework: **Next.js** (se detecta solo).
3. En **Environment Variables**, cargá las mismas `NEXT_PUBLIC_FIREBASE_*` de tu `.env.local`.
4. **Deploy**. Vercel te da la URL pública.
5. En Firebase → **Authentication → Settings → Authorized domains**, agregá el dominio de Vercel.

---

## 📁 Estructura
```
src/
  app/
    page.jsx              Tabla de posiciones (inicio)
    calendario/           Calendario y resultados
    estadisticas/         Líderes individuales
    mesa-tecnica/         Anotador (admin)
    partido/[id]/         Vista de un partido (marcador + stats)
    login/  cuenta/       Acceso y perfil
  components/             Nav, Anotador, guardas, UI
  context/AuthContext     Sesión y roles
  lib/
    firebase.js           Inicialización
    data.js               Lectura/escritura Firestore
    standings.js          Cálculo de la tabla
    stats.js              Definición de estadísticas y fórmulas
firestore.rules           Seguridad (lectura pública, escritura admin)
public/                   Manifest PWA, service worker, íconos
```

## 🧮 Modelo de datos (Firestore)
- `teams/{id}` → `{ name, color }`
- `players/{id}` → `{ name, number, teamId, role, photoUrl? }`
- `matches/{id}` → `{ homeTeamId, awayTeamId, date, court, status, sets[], winner? }`
- `matches/{id}/stats/{playerId}` → contadores por jugador en ese partido
- `users/{uid}` → `{ email, role }`

> Cuando me pases tu base de datos definitiva, ajustamos estos nombres de campos/colecciones sin tocar la lógica de la UI.
