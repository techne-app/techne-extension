import React, { useState, useEffect } from 'react';
import { vectorDb, type Embedding } from '../../background/db';

export const VectorViewer: React.FC = () => {
  // State for embeddings data, loading state and errors
  const [embeddings, setEmbeddings] = useState<Embedding[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load embeddings function
  const loadEmbeddings = async () => {
    try {
      const records = await vectorDb.getAllEmbeddings();
      setEmbeddings(records);
    } catch (err) {
      console.error('Failed to load embeddings:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Handle clear all embeddings
  const handleClearAll = async () => {
    try {
      await vectorDb.clearEmbeddings();
      setEmbeddings([]);
    } catch (err) {
      console.error('Failed to clear embeddings:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // Load embeddings on component mount and set up message listener
  useEffect(() => {
    loadEmbeddings();

    const messageListener = (message: any) => {
      if (message.type === 'EMBEDDINGS_UPDATED') {
        loadEmbeddings();
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  // Format vector data for display, showing first 3 values
  const formatVector = (vectorData: Float32Array | undefined): string => {
    if (!vectorData) return 'No data';
    const array = Array.from(vectorData);
    return array.slice(0, 3).map(n => n.toFixed(4)).join(', ') + 
           (array.length > 3 ? '...' : '');
  };

  // Format timestamp to locale string
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  // Loading state
  if (loading) {
    return (
      <div className="p-4 text-gray-600">Loading embeddings...</div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-4 text-red-600">
        Error loading embeddings: {error}
      </div>
    );
  }

  // Main render with list of embeddings
  return (
    <div className="w-96 p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Stored Embeddings</h1>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleClearAll}
            className="text-red-600 hover:text-red-800"
            title="Clear all embeddings"
          >
            🗑️
          </button>
          <span className="text-sm text-gray-500">
            {embeddings.length} total
          </span>
        </div>
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