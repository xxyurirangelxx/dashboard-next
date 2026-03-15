const DB_NAME = 'DashboardDB';
const STORE_NAME = 'csv_files';

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onerror = () => reject('Erro ao abrir o banco de dados.');
        request.onsuccess = (event) => resolve(event.target.result);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'key' });
            }
        };
    });
}

export async function saveFile(key, data) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put({ key, ...data });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(`Erro ao salvar o arquivo ${key}.`);
    });
}

export async function loadFile(key) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(`Erro ao carregar o arquivo ${key}.`);
    });
}

export async function clearAll() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject('Erro ao limpar o banco de dados.');
    });
}

export const Storage = {
    save: (key, data) => {
        try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) { console.error(`Erro ao salvar: ${key}`, e); }
    },
    load: (key) => {
        try { const data = localStorage.getItem(key); return data ? JSON.parse(data) : null; } catch (e) { console.error(`Erro ao carregar: ${key}`, e); return null; }
    },
};
