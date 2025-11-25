
'use client';

import { useState, useEffect } from 'react';
import type { GalleryItem } from '../../lib/gallery-types';

// Response shape for the debug API endpoint
interface GalleryD1Response {
  images?: GalleryItem[];
  error?: string;
  success?: boolean;
  key?: string;
}

export default function TestGalleryD1Page() {
  const [images, setImages] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/debug/gallery-d1');
      const data: GalleryD1Response = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch images');
      }
      
      setImages(Array.isArray(data.images) ? data.images : []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const handleCreateTestImage = async () => {
    try {
      setUploading(true);
      const res = await fetch('/api/debug/gallery-d1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alt: 'Test Image ' + new Date().toLocaleTimeString(),
          category: 'art',
          width: 800,
          height: 600,
        }),
      });
      const data: GalleryD1Response = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create image');
      }
      
      await fetchImages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (key: string) => {
    try {
      const res = await fetch(`/api/debug/gallery-d1?key=${encodeURIComponent(key)}`, {
        method: 'DELETE',
      });
      const data: GalleryD1Response = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete image');
      }
      
      await fetchImages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8">D1 Gallery Integration Test</h1>
      
      <div className="mb-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <p className="mb-4">
          This page tests the direct D1 database integration for gallery images.
          It uses the <code>/api/debug/gallery-d1</code> endpoint.
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Note: This requires the D1 binding to be available in the environment (e.g. via <code>wrangler dev</code> or deployed).
        </p>
      </div>

      <div className="mb-8">
        <button
          onClick={handleCreateTestImage}
          disabled={uploading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {uploading ? 'Creating...' : 'Create Test Record in D1'}
        </button>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-100 text-red-800 rounded border border-red-200">
          Error: {error}
        </div>
      )}

      {loading ? (
        <p>Loading images...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.length === 0 ? (
            <p className="col-span-full text-center text-gray-500">No images found in D1.</p>
          ) : (
            images.map((img) => (
              <div key={img.id} className="border rounded-lg overflow-hidden shadow-sm bg-white dark:bg-gray-900">
                <div className="aspect-video bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                  {/* We don't actually display the image because the src might be fake in this test */}
                  <span className="text-gray-400">Image Placeholder</span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold truncate" title={img.alt}>{img.alt}</h3>
                  <div className="text-xs text-gray-500 mt-2 space-y-1">
                    <p>ID: {img.id}</p>
                    <p>Key: {img.key}</p>
                    <p>Category: {img.category}</p>
                    <p>Dims: {img.width}x{img.height}</p>
                    <p>Size: {img.size} bytes</p>
                    <p>Modified: {new Date(img.lastModified || '').toLocaleString()}</p>
                  </div>
                  <button
                    onClick={() => { if (img.key) handleDelete(img.key); }}
                    className="mt-4 w-full px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
                  >
                    Delete from D1
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
