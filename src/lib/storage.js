"use client";

import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "./firebase";

// Redimensiona la imagen en el navegador antes de subirla (ahorra espacio y
// acelera la carga). Devuelve un Blob JPEG.
async function resizeImage(file, maxSize = 800, quality = 0.82) {
  if (!file || !file.type?.startsWith("image/")) return file;
  const url = URL.createObjectURL(file);
  try {
    const img = document.createElement("img");
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = rej;
      img.src = url;
    });
    let { width, height } = img;
    if (width > height && width > maxSize) {
      height = Math.round((height * maxSize) / width);
      width = maxSize;
    } else if (height > maxSize) {
      width = Math.round((width * maxSize) / height);
      height = maxSize;
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d").drawImage(img, 0, 0, width, height);
    return await new Promise((res) =>
      canvas.toBlob((b) => res(b || file), "image/jpeg", quality)
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Sube una imagen a la ruta indicada y devuelve { url, path }.
export async function uploadImage(file, path) {
  if (!storage) throw new Error("El almacenamiento de Firebase no está configurado.");
  const blob = await resizeImage(file);
  const r = ref(storage, path);
  await uploadBytes(r, blob, { contentType: "image/jpeg" });
  const url = await getDownloadURL(r);
  return { url, path };
}

export async function deleteImage(path) {
  if (!storage || !path) return;
  try {
    await deleteObject(ref(storage, path));
  } catch {
    // Si ya no existe, lo ignoramos.
  }
}
