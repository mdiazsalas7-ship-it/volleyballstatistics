import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { db } from "./firebase";
import { deleteImage } from "./storage";
import { emptyStats } from "./stats";

// Si Firebase no está listo (faltan variables en Vercel), estas funciones
// devuelven vacío en vez de lanzar error, para que la app no quede en blanco.
const noop = () => {};

// ---------- Equipos ----------
export async function getTeams() {
  if (!db) return [];
  const snap = await getDocs(query(collection(db, "teams"), orderBy("name")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
export async function getTeam(id) {
  if (!db) return null;
  const d = await getDoc(doc(db, "teams", id));
  return d.exists() ? { id: d.id, ...d.data() } : null;
}
export async function createTeam(data) {
  if (!db) throw new Error("Firebase no configurado");
  return addDoc(collection(db, "teams"), { ...data, createdAt: serverTimestamp() });
}
export async function updateTeam(id, data) {
  if (!db) throw new Error("Firebase no configurado");
  return updateDoc(doc(db, "teams", id), data);
}
export async function deleteTeam(id) {
  if (!db) throw new Error("Firebase no configurado");
  // Borra también los jugadores del equipo y sus fotos.
  const teamSnap = await getDoc(doc(db, "teams", id));
  const players = await getDocs(query(collection(db, "players"), where("teamId", "==", id)));
  await Promise.all(
    players.docs.map(async (p) => {
      const data = p.data();
      if (data.photoPath) await deleteImage(data.photoPath);
      return deleteDoc(p.ref);
    })
  );
  if (teamSnap.exists() && teamSnap.data().logoPath) {
    await deleteImage(teamSnap.data().logoPath);
  }
  return deleteDoc(doc(db, "teams", id));
}

// ---------- Jugadores ----------
export async function getPlayers() {
  if (!db) return [];
  const snap = await getDocs(collection(db, "players"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
export async function getPlayersByTeam(teamId) {
  if (!db) return [];
  const snap = await getDocs(query(collection(db, "players"), where("teamId", "==", teamId)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
export async function createPlayer(data) {
  if (!db) throw new Error("Firebase no configurado");
  return addDoc(collection(db, "players"), { ...data, createdAt: serverTimestamp() });
}
export async function updatePlayer(id, data) {
  if (!db) throw new Error("Firebase no configurado");
  return updateDoc(doc(db, "players", id), data);
}
export async function deletePlayer(id) {
  if (!db) throw new Error("Firebase no configurado");
  const snap = await getDoc(doc(db, "players", id));
  if (snap.exists() && snap.data().photoPath) await deleteImage(snap.data().photoPath);
  return deleteDoc(doc(db, "players", id));
}

// ---------- Partidos ----------
export async function getMatches() {
  if (!db) return [];
  const snap = await getDocs(query(collection(db, "matches"), orderBy("date")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
export function watchMatch(matchId, cb) {
  if (!db) { cb(null); return noop; }
  return onSnapshot(doc(db, "matches", matchId), (d) =>
    cb(d.exists() ? { id: d.id, ...d.data() } : null)
  );
}
export function watchMatches(cb) {
  if (!db) { cb([]); return noop; }
  return onSnapshot(query(collection(db, "matches"), orderBy("date")), (snap) =>
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  );
}
export async function createMatch(data) {
  if (!db) throw new Error("Firebase no configurado");
  return addDoc(collection(db, "matches"), {
    status: "scheduled",
    sets: [],
    createdAt: serverTimestamp(),
    ...data,
  });
}
export async function updateMatch(matchId, data) {
  if (!db) throw new Error("Firebase no configurado");
  return updateDoc(doc(db, "matches", matchId), data);
}
export async function deleteMatch(matchId) {
  if (!db) throw new Error("Firebase no configurado");
  return deleteDoc(doc(db, "matches", matchId));
}

// ---------- Estadísticas por partido ----------
export function watchMatchStats(matchId, cb) {
  if (!db) { cb([]); return noop; }
  return onSnapshot(collection(db, "matches", matchId, "stats"), (snap) =>
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  );
}
export async function applyStatAction(matchId, player, applyMap) {
  if (!db) throw new Error("Firebase no configurado");
  const ref = doc(db, "matches", matchId, "stats", player.id);
  const existing = await getDoc(ref);
  if (!existing.exists()) {
    await setDoc(ref, {
      playerId: player.id,
      playerName: player.name,
      number: player.number ?? null,
      teamId: player.teamId,
      photoUrl: player.photoUrl || null,
      ...emptyStats(),
    });
  }
  const incs = {};
  for (const [k, v] of Object.entries(applyMap)) incs[k] = increment(v);
  await updateDoc(ref, incs);
}

export async function getAllPlayerStats() {
  if (!db) return [];
  const snap = await getDocs(collectionGroup(db, "stats"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
