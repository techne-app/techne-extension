interface Embedding {
  id: number;
  tag: string;
  vectorData: Float32Array;
  timestamp: number;
  anchor: string;
}

class VectorDB {
  private dbName = 'VectorDB';
  private version = 1;

  async open(): Promise<IDBDatabase> {
      return new Promise((resolve, reject) => {
          const request = indexedDB.open(this.dbName, this.version);
          
          request.onerror = () => reject(request.error);
          request.onsuccess = () => resolve(request.result);
          
          request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
              const db = (event.target as IDBOpenDBRequest).result;
              if (!db.objectStoreNames.contains('embeddings')) {
                  const store = db.createObjectStore('embeddings', { 
                      keyPath: 'id', 
                      autoIncrement: true 
                  });
                  store.createIndex('tag', 'tag');
                  store.createIndex('timestamp', 'timestamp');
              }
          };
      });
  }

  async getAllEmbeddings(): Promise<Embedding[]> {
      const db = await this.open();
      return new Promise((resolve, reject) => {
          const transaction = db.transaction(['embeddings'], 'readonly');
          const store = transaction.objectStore('embeddings');
          const request = store.getAll();
          
          request.onerror = () => reject(request.error);
          request.onsuccess = () => resolve(request.result);
      });
  }

  async storeEmbedding(tag: string, vector: number[], anchor: string): Promise<number> {
      const db = await this.open();
      return new Promise((resolve, reject) => {
          const transaction = db.transaction(['embeddings'], 'readwrite');
          const store = transaction.objectStore('embeddings');
          const embedding: Omit<Embedding, 'id'> = {
              tag,
              vectorData: new Float32Array(vector),
              timestamp: Date.now(),
              anchor
          };
          
          const request = store.add(embedding);
          request.onerror = () => reject(request.error);
          request.onsuccess = () => resolve(request.result as number);
      });
  }

  async clearEmbeddings(): Promise<void> {
      const db = await this.open();
      return new Promise((resolve, reject) => {
          const transaction = db.transaction(['embeddings'], 'readwrite');
          const store = transaction.objectStore('embeddings');
          const request = store.clear();

          request.onerror = () => reject(request.error);
          request.onsuccess = () => resolve();
      });
  }
}

export const vectorDb = new VectorDB();
export type { Embedding };