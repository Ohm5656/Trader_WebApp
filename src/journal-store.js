import { collection, deleteDoc, doc, getDocs, onSnapshot, setDoc } from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "./firebase.js";

const profileRef = (uid) => doc(db, "users", uid, "profiles", "journal");
const tradesRef = (uid) => collection(db, "users", uid, "trades");

export function listenToCloudJournal(uid, onChange, onError) {
  const stopProfile = onSnapshot(profileRef(uid), (snapshot) => onChange({ type: "profile", data: snapshot.exists() ? snapshot.data() : null }), onError);
  const stopTrades = onSnapshot(tradesRef(uid), (snapshot) => onChange({ type: "trades", data: snapshot.docs.map((item) => item.data()) }), onError);
  return () => { stopProfile(); stopTrades(); };
}

export async function saveProfile(uid, { settings, goal }) {
  await setDoc(profileRef(uid), { settings, goal, updatedAt: Date.now() }, { merge: true });
}

export async function saveTrade(uid, trade) {
  await setDoc(doc(tradesRef(uid), trade.date), { ...trade, updatedAt: Date.now() }, { merge: true });
}

export async function seedCloudJournal(uid, { trades, settings, goal }) {
  await saveProfile(uid, { settings, goal });
  await Promise.all(trades.map((trade) => saveTrade(uid, trade)));
}

export async function clearCloudJournal(uid, trades) {
  await Promise.all(trades.flatMap((trade) => [
    deleteDoc(doc(tradesRef(uid), trade.date)),
    ...(trade.images || []).filter((image) => image.path).map((image) => deleteObject(ref(storage, image.path)).catch(() => undefined)),
  ]));
  await deleteDoc(profileRef(uid));
}

function sanitizedName(name) { return name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-72) || "trade-image.jpg"; }

async function compressImage(file) {
  if (!file.type.startsWith("image/")) throw new Error(`${file.name} is not an image.`);
  const source = await createImageBitmap(file);
  const longestSide = Math.max(source.width, source.height);
  const scale = Math.min(1, 1600 / longestSide);
  const width = Math.max(1, Math.round(source.width * scale));
  const height = Math.max(1, Math.round(source.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height;
  canvas.getContext("2d").drawImage(source, 0, 0, width, height);
  source.close();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
  if (!blob) throw new Error(`Could not compress ${file.name}.`);
  if (blob.size > 4.5 * 1024 * 1024) throw new Error(`${file.name} is too large after compression.`);
  return blob;
}

export async function uploadTradeImages(uid, tradeDate, files, onProgress = () => {}) {
  const total = files.length; const uploads = [];
  for (const [index, file] of [...files].entries()) {
    const blob = await compressImage(file);
    const name = `${crypto.randomUUID()}-${sanitizedName(file.name).replace(/\.[^.]+$/, "")}.jpg`;
    const path = `users/${uid}/trades/${tradeDate}/${name}`;
    const location = ref(storage, path);
    await uploadBytes(location, blob, { contentType: "image/jpeg", cacheControl: "public,max-age=31536000,immutable" });
    uploads.push({ name: file.name, path, url: await getDownloadURL(location), contentType: "image/jpeg", size: blob.size, createdAt: Date.now() });
    onProgress(index + 1, total);
  }
  return uploads;
}

export async function deleteTradeImages(images = []) {
  await Promise.all(images.filter((image) => image.path).map((image) => deleteObject(ref(storage, image.path)).catch(() => undefined)));
}
