# 🏷️ Marca personalizable (white-label) y Noticias

Pensado para vender la app a distintas ligas o torneos: cada cliente pone su
propia identidad sin tocar el código.

## Cambiar el nombre y el logo de la liga
1. Iniciá sesión como **administrador**.
2. Andá a **Cuenta** → sección **"Marca de la liga"**.
3. Cambiá el **nombre** (ej. "Liga Metropolitana de Voley") y subí el **logo**.
4. Guardá. El encabezado superior de **toda la app** se actualiza al instante
   (para todos los usuarios), porque se lee en tiempo real desde Firestore.

Dónde se guarda: documento `settings/branding` en Firestore y el logo en
`branding/logo.jpg` de Storage. Si no se configura, se muestra "Torneo Voley"
con el ícono por defecto.

## Publicar noticias
1. Como admin, entrá a **Noticias** (o Cuenta → "Gestionar noticias").
2. Tocá **+ Noticia**, poné título, contenido e imagen de portada, y publicá.
3. Las noticias aparecen en la pantalla de **Inicio** (carrusel "Noticias") y en
   la sección **Noticias**. Cualquiera puede leerlas; solo el admin las crea,
   edita o elimina.

Dónde se guarda: colección `news` en Firestore y las imágenes en `news/{id}/cover.jpg`.

## Seguridad
Todo esto usa las mismas reglas ya publicadas:
- Firestore: `settings` y `news` → lectura pública, escritura solo admin.
- Storage: lectura pública, escritura solo admin (imágenes hasta 5 MB).

No hacen falta variables de entorno nuevas.

## Idea para vender a varias ligas
Cada liga que compre la app usa su **propio proyecto de Firebase** (su base de
datos y su marca). Así los datos quedan separados por cliente. Para una versión
multi-liga dentro de una sola instalación (varias ligas en la misma base),
avisá y lo evolucionamos a un modelo por "tenant".
