import { Search } from '../types/search';

class SearchDB {
  private dbName = 'SearchDB';
  private version = 1;

  async open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('searches')) {
          const store = db.createObjectStore('searches', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          store.createIndex('query', 'query');
          store.createIndex('timestamp', 'timestamp');
        }
      };
    });
  }

  async getAllSearches(): Promise<Search[]> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['searches'], 'readonly');
      const store = transaction.objectStore('searches');
      const request = store.getAll();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async storeSearch(query: string): Promise<number> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['searches'], 'readwrite');
      const store = transaction.objectStore('searches');
      const search_data: Omit<Search, 'id'> = {
        query,
        timestamp: Date.now()
      };
      
      const request = store.add(search_data);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as number);
    });
  }

  async clearSearches(): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['searches'], 'readwrite');
      const store = transaction.objectStore('searches');
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getRecentSearches(k: number): Promise<Search[]> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['searches'], 'readonly');
      const store = transaction.objectStore('searches');
      const index = store.index('timestamp');
      
      // Use a cursor to get the most recent k searches
      const searches: Search[] = [];
      const request = index.openCursor(null, 'prev'); // 'prev' for descending order
      
      request.onerror = () => reject(request.error);
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor && searches.length < k) {
          searches.push(cursor.value);
          cursor.continue();
        } else {
          resolve(searches);
        }
      };
    });
  }
}

export const searchDb = new SearchDB();
export type { Search }; 