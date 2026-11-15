import { collection, deleteDoc, doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "./firebase.js";

const mediaDatabase = "tradeboard-local-media";
const mediaStore = "images";
const profileRef = (uid) => doc(db, "users", uid, "profiles", "journal");
const tradesRef = (uid) => collection(db, "users", uid, "trades");

function openMediaDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(mediaDatabase, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(mediaStore, { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function mediaTransaction(mode, action) {
  const database = await openMediaDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(mediaStore, mode); const store = transaction.objectStore(mediaStore); const result = action(store);
    transaction.oncomplete = () => { database.close(); resolve(result); };
    transaction.onerror = () => { database.close(); reject(transaction.error); };
  });
}
async function compressImage(file) {
  if (!file.type.startsWith("image/")) throw new Error(`${file.name} is not an image.`);
  const source = await createImageBitmap(file); const scale = Math.min(1, 1600 / Math.max(source.width, source.height));
  const canvas = document.createElement("canvas"); canvas.width = Math.max(1, Math.round(source.width * scale)); canvas.height = Math.max(1, Math.round(source.height * scale)); canvas.getContext("2d").drawImage(source, 0, 0, canvas.width, canvas.height); source.close();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
  if (!blob) throw new Error(`Could not compress ${file.name}.`); if (blob.size > 4.5 * 1024 * 1024) throw new Error(`${file.name} is too large after compression.`);
  return blob;
}

export function listenToCloudJournal(uid, onChange, onError) {
  const stopProfile = onSnapshot(profileRef(uid), (snapshot) => onChange({ type: "profile", data: snapshot.exists() ? snapshot.data() : null }), onError);
  const stopTrades = onSnapshot(tradesRef(uid), (snapshot) => onChange({ type: "trades", data: snapshot.docs.map((item) => item.data()) }), onError);
  return () => { stopProfile(); stopTrades(); };
}
export function saveProfile(uid, { settings, goal }) { return setDoc(profileRef(uid), { settings, goal, updatedAt: Date.now() }, { merge: true }); }
export function saveTrade(uid, trade) { return setDoc(doc(tradesRef(uid), trade.date), { ...trade, updatedAt: Date.now() }, { merge: true }); }
export async function seedCloudJournal(uid, { trades, settings, goal }) { await saveProfile(uid, { settings, goal }); await Promise.all(trades.map((trade) => saveTrade(uid, trade))); }
export async function clearCloudJournal(uid, trades) { await Promise.all(trades.map((trade) => deleteDoc(doc(tradesRef(uid), trade.date)))); await deleteDoc(profileRef(uid)); }

export async function saveLocalTradeImages(tradeDate, files, onProgress = () => {}) {
  const images = [];
  for (const [index, file] of [...files].entries()) {
    const blob = await compressImage(file); const id = crypto.randomUUID(); const image = { id, tradeDate, name: file.name, contentType: "image/jpeg", size: blob.size, createdAt: Date.now(), blob };
    await mediaTransaction("readwrite", (store) => store.put(image)); images.push({ id, name: image.name, contentType: image.contentType, size: image.size, createdAt: image.createdAt, localOnly: true }); onProgress(index + 1, files.length);
  }
  return images;
}
export async function clearLocalImages(images = []) { await Promise.all(images.filter((image) => image.id).map((image) => mediaTransaction("readwrite", (store) => store.delete(image.id)))); }
