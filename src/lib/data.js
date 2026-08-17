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
import { emptyStats } from "./stats";

// ---------- Equipos ----------
export async function getTeams() {
  const snap = await getDocs(query(collection(db, "teams"), orderBy("name")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
export async function createTeam(data) {
  return addDoc(collection(db, "teams"), { ...data, createdAt: serverTimestamp() });
}

// ---------- Jugadores ----------
export async function getPlayers() {
  const snap = await getDocs(collection(db, "players"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
export async function getPlayersByTeam(teamId) {
  const snap = await getDocs(query(collection(db, "players"), where("teamId", "==", teamId)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ---------- Partidos ----------
export async function getMatches() {
  const snap = await getDocs(query(collection(db, "matches"), orderBy("date")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
export function watchMatch(matchId, cb) {
  return onSnapshot(doc(db, "matches", matchId), (d) =>
    cb(d.exists() ? { id: d.id, ...d.data() } : null)
  );
}
export function watchMatches(cb) {
  return onSnapshot(query(collection(db, "matches"), orderBy("date")), (snap) =>
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  );
}
export async function createMatch(data) {
  return addDoc(collection(db, "matches"), {
    status: "scheduled",
    sets: [],
    createdAt: serverTimestamp(),
    ...data,
  });
}
export async function updateMatch(matchId, data) {
  return updateDoc(doc(db, "matches", matchId), data);
}
export async function deleteMatch(matchId) {
  return deleteDoc(doc(db, "matches", matchId));
}

// ---------- Estadísticas por partido ----------
// matches/{matchId}/stats/{playerId}
export function watchMatchStats(matchId, cb) {
  return onSnapshot(collection(db, "matches", matchId, "stats"), (snap) =>
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  );
}
export async function applyStatAction(matchId, player, applyMap) {
  const ref = doc(db, "matches", matchId, "stats", player.id);
  const existing = await getDoc(ref);
  if (!existing.exists()) {
    await setDoc(ref, {
      playerId: player.id,
      playerName: player.name,
      number: player.number || null,
      teamId: player.teamId,
      ...emptyStats(),
    });
  }
  const incs = {};
  for (const [k, v] of Object.entries(applyMap)) incs[k] = increment(v);
  await updateDoc(ref, incs);
}

// Todas las estadísticas de todos los partidos (para líderes del torneo)
export async function getAllPlayerStats() {
  const snap = await getDocs(collectionGroup(db, "stats"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
