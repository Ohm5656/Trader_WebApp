const databaseName = "tradeboard-local-media";
const storeName = "images";

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(storeName, { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function transaction(mode, action) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = database.transaction(storeName, mode); const store = request.objectStore(storeName); const result = action(store);
    request.oncomplete = () => { database.close(); resolve(result); };
    request.onerror = () => { database.close(); reject(request.error); };
  });
}

async function compress(file) {
  if (!file.type.startsWith("image/")) throw new Error(`${file.name} is not an image.`);
  const source = await createImageBitmap(file); const scale = Math.min(1, 1600 / Math.max(source.width, source.height));
  const canvas = document.createElement("canvas"); canvas.width = Math.max(1, Math.round(source.width * scale)); canvas.height = Math.max(1, Math.round(source.height * scale));
  canvas.getContext("2d").drawImage(source, 0, 0, canvas.width, canvas.height); source.close();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
  if (!blob) throw new Error(`Could not process ${file.name}.`); if (blob.size > 4.5 * 1024 * 1024) throw new Error(`${file.name} is too large after compression.`);
  return blob;
}

export async function saveTradeImages(tradeDate, files, onProgress = () => {}) {
  const metadata = [];
  for (const [index, file] of [...files].entries()) {
    const blob = await compress(file); const id = crypto.randomUUID(); const image = { id, tradeDate, name: file.name, contentType: "image/jpeg", size: blob.size, createdAt: Date.now(), blob };
    await transaction("readwrite", (store) => store.put(image)); metadata.push({ id, name: image.name, contentType: image.contentType, size: image.size, createdAt: image.createdAt, localOnly: true }); onProgress(index + 1, files.length);
  }
  return metadata;
}

export async function deleteTradeImages(images = []) { await Promise.all(images.filter((image) => image.id).map((image) => transaction("readwrite", (store) => store.delete(image.id)))); }
