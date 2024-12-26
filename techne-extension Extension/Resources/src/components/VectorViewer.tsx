import React, { useState, useEffect } from 'react';

interface Embedding {
  id: number;
  tag: string;
  vectorData: Float32Array;
  timestamp: number;
}

interface DbWrapper {
  open(): Promise<IDBDatabase>;
  getAllEmbeddings(): Promise<Embedding[]>;
}

const db: DbWrapper = {
  async open() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('VectorDB', 1);
      
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
  },

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
};

export const VectorViewer: React.FC = () => {
  const [embeddings, setEmbeddings] = useState<Embedding[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEmbeddings = async () => {
      try {
        const records = await db.getAllEmbeddings();
        setEmbeddings(records);
      } catch (err) {
        console.error('Failed to load embeddings:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadEmbeddings();
  }, []);

  const formatVector = (vectorData: Float32Array | undefined): string => {
    if (!vectorData) return 'No data';
    const array = Array.from(vectorData);
    return array.slice(0, 3).map(n => n.toFixed(4)).join(', ') + 
           (array.length > 3 ? '...' : '');
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div className="p-4 text-gray-600">Loading embeddings...</div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-600">
        Error loading embeddings: {error}
      </div>
    );
  }

  return (
    <div className="w-96 p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Stored Embeddings</h1>
        <span className="text-sm text-gray-500">
          {embeddings.length} total
        </span>
      </div>
      
      {embeddings.length === 0 ? (
        <div className="text-gray-500 text-center py-8">
          No embeddings stored yet
        </div>
      ) : (
        <div className="space-y-4">
          {embeddings.map((emb) => (
            <div key={emb.id} className="border rounded p-3 bg-white shadow-sm">
              <div className="flex justify-between items-start">
                <span className="font-medium text-blue-600">
                  {emb.tag}
                </span>
                <span className="text-xs text-gray-500">
                  {formatDate(emb.timestamp)}
                </span>
              </div>
              <div className="mt-2 text-sm font-mono text-gray-600 overflow-hidden">
                [{formatVector(emb.vectorData)}]
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};