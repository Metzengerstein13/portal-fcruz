import { ManagedUser } from '../types';

const DB_NAME = 'FC_Portal_Durable_DB';
const STORE_USERS = 'fc_users_records';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 4);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_USERS)) {
        db.createObjectStore(STORE_USERS);
      }
    };
  });
}

export async function saveUsersToIndexedDb(users: ManagedUser[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_USERS, 'readwrite');
    const store = tx.objectStore(STORE_USERS);
    store.put(users, 'all_users');
  } catch (err) {
    console.warn('Could not save users to IndexedDB:', err);
  }
}

export async function getUsersFromIndexedDb(): Promise<ManagedUser[] | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_USERS, 'readonly');
    const store = tx.objectStore(STORE_USERS);
    const request = store.get('all_users');
    return new Promise((resolve) => {
      request.onsuccess = () => {
        if (Array.isArray(request.result) && request.result.length > 0) {
          resolve(request.result);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => resolve(null);
    });
  } catch (err) {
    return null;
  }
}
