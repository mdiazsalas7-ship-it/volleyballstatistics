# 🖼️ Etapa 3 — Equipos, roster y fotos

La sección **Equipos** ya está en la app (pestaña Equipos). Para que las **fotos**
funcionen hay que activar **Firebase Storage** una vez.

## 1. Activar Storage
Firebase Console → **Compilación → Storage** → **Comenzar** → elegí la ubicación
(la que te sugiera está bien) → Listo.

## 2. Publicar las reglas de seguridad
Firebase Console → **Storage → Reglas** → pegá el contenido de `storage.rules`
de este proyecto → **Publicar**.

Estas reglas permiten:
- **Ver** las fotos a cualquiera (necesario para mostrarlas en la app).
- **Subir/cambiar** fotos solo a administradores, solo imágenes y hasta 5 MB.

## 3. (Si hiciste deploy antes) nada más que hacer
No hacen falta variables nuevas: Storage usa la misma configuración de Firebase
que ya tenés cargada. Solo activá Storage y publicá las reglas.

## Cómo se usa
- **Todos** ven la pestaña **Equipos**, entran a un equipo y ven el roster con fotos.
- **Admin**:
  - En **Equipos** → **+ Equipo** (nombre, color y logo).
  - Dentro de un equipo → **+ Jugador** (nombre, dorsal, posición y foto).
  - Puede **Editar** o **Eliminar** equipos y jugadores.
- Las fotos se **redimensionan solas** en el celular antes de subirse, así ocupan
  poco y cargan rápido.

## Detalle técnico
- Fotos de jugador: `players/{idJugador}/photo.jpg`
- Logo de equipo: `teams/{idEquipo}/logo.jpg`
- Al eliminar un jugador o equipo, sus fotos se borran también del almacenamiento.
- El roster que carga el admin es el mismo que aparece en la **Mesa técnica** para
  anotar estadísticas: ya quedan conectados.
