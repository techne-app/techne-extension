import { Tag } from '../types/tag';

class TagDB {
  private dbName = 'TagDB';
  private version = 1;

  async open(): Promise<IDBDatabase> {
      return new Promise((resolve, reject) => {
          const request = indexedDB.open(this.dbName, this.version);
          
          request.onerror = () => reject(request.error);
          request.onsuccess = () => resolve(request.result);
          
          request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
              const db = (event.target as IDBOpenDBRequest).result;
              if (!db.objectStoreNames.contains('tags')) {
                  const store = db.createObjectStore('tags', { 
                      keyPath: 'id', 
                      autoIncrement: true 
                  });
                  store.createIndex('tag', 'tag');
                  store.createIndex('timestamp', 'timestamp');
              }
          };
      });
  }

  async getAllTags(): Promise<Tag[]> {
      const db = await this.open();
      return new Promise((resolve, reject) => {
          const transaction = db.transaction(['tags'], 'readonly');
          const store = transaction.objectStore('tags');
          const request = store.getAll();
          
          request.onerror = () => reject(request.error);
          request.onsuccess = () => resolve(request.result);
      });
  }

  async storeTag(tag: string, type: string, anchor: string): Promise<number> {
      const db = await this.open();
      return new Promise((resolve, reject) => {
          const transaction = db.transaction(['tags'], 'readwrite');
          const store = transaction.objectStore('tags');
          const tag_data: Omit<Tag, 'id'> = {
              tag,
              type,
              timestamp: Date.now(),
              anchor
          };
          
          const request = store.add(tag_data);
          request.onerror = () => reject(request.error);
          request.onsuccess = () => resolve(request.result as number);
      });
  }

  async clearTags(): Promise<void> {
      const db = await this.open();
      return new Promise((resolve, reject) => {
          const transaction = db.transaction(['tags'], 'readwrite');
          const store = transaction.objectStore('tags');
          const request = store.clear();

          request.onerror = () => reject(request.error);
          request.onsuccess = () => resolve();
      });
  }
}

export const tagDb = new TagDB();
export type { Tag };