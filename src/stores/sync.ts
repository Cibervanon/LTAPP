import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "liftingtrust_offline";
const STORE_NAME = "sync_queue";

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
        }
      },
    });
  }
  return dbPromise;
}

export type SyncAction = {
  table: string;
  operation: "insert" | "update" | "delete";
  payload: any;
  referenceId?: string;
  createdAt: number;
};

export async function enqueueSync(action: Omit<SyncAction, "createdAt">) {
  const db = await getDB();
  await db.add(STORE_NAME, { ...action, createdAt: Date.now() });
}

export async function getPendingSync(): Promise<SyncAction[]> {
  const db = await getDB();
  return db.getAll(STORE_NAME);
}

export async function removeSync(id: number) {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
}

export async function clearSync() {
  const db = await getDB();
  await db.clear(STORE_NAME);
}
