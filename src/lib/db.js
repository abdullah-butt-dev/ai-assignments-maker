// Minimal IndexedDB wrapper. Replaces localStorage for wizard state so
// embedded images (base64) don't silently blow the ~5-10MB localStorage cap.

const DB_NAME = "assignment_maker"
const STORE_NAME = "kv"
const DB_VERSION = 1

let dbPromise = null

function openDb() {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  return dbPromise
}

export async function idbGet(key) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly")
    const req = tx.objectStore(STORE_NAME).get(key)
    req.onsuccess = () => resolve(req.result ?? null)
    req.onerror = () => reject(req.error)
  })
}

export async function idbSet(key, value) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite")
    tx.objectStore(STORE_NAME).put(value, key)
    tx.oncomplete = () => resolve(true)
    tx.onerror = () => reject(tx.error)
  })
}

export async function idbDelete(key) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite")
    tx.objectStore(STORE_NAME).delete(key)
    tx.oncomplete = () => resolve(true)
    tx.onerror = () => reject(tx.error)
  })
}
