'use client';

import { useState, useActionState } from 'react';
import Image from 'next/image';
import {
  updateHeroCarouselAction,
  type ActionState,
} from '../../../lib/admin-actions-pricing';
import type { GalleryItem } from '../../../lib/gallery-types';

interface HeroClientProps {
  images: GalleryItem[];
  carouselIds: string[] | null;
}

export default function HeroClient({ images, carouselIds }: HeroClientProps) {
  // Initialize selected images from saved carousel IDs or all images
  const [selectedKeys, setSelectedKeys] = useState<string[]>(() => {
    if (carouselIds && carouselIds.length > 0) {
      return carouselIds;
    }
    // Default: all images selected
    return images.map(img => img.key || img.id);
  });

  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    updateHeroCarouselAction,
    null
  );

  const toggleImage = (key: string) => {
    setSelectedKeys(prev => {
      if (prev.includes(key)) {
        // Prevent deselecting if it's the last selected image
        if (prev.length <= 1) return prev;
        return prev.filter(k => k !== key);
      }
      // Add to end of selection (order matters)
      return [...prev, key];
    });
  };

  const moveUp = (key: string) => {
    setSelectedKeys(prev => {
      const idx = prev.indexOf(key);
      if (idx <= 0) return prev;
      const newOrder = [...prev];
      [newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]];
      return newOrder;
    });
  };

  const moveDown = (key: string) => {
    setSelectedKeys(prev => {
      const idx = prev.indexOf(key);
      if (idx < 0 || idx >= prev.length - 1) return prev;
      const newOrder = [...prev];
      [newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]];
      return newOrder;
    });
  };

  if (images.length === 0) {
    return (
      <div className="admin-card p-8 text-center text-gray-400">
        <p>No hero images available.</p>
        <p className="text-sm mt-2">
          Upload images to the &quot;hero&quot; category in the Gallery to make them available here.
        </p>
      </div>
    );
  }

  // Check if selection has changed from saved state
  const hasChanges = JSON.stringify(selectedKeys) !== JSON.stringify(carouselIds || images.map(img => img.key || img.id));

  return (
    <div className="space-y-6">
      {state?.error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-2 rounded">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="bg-green-900/50 border border-green-500 text-green-200 px-4 py-2 rounded">
          Carousel selection saved successfully!
        </div>
      )}

      <div className="admin-card p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-white">Select Carousel Images</h3>
            <p className="text-sm text-gray-400">
              Click images to toggle selection. Drag numbers to reorder. First image appears first.
            </p>
          </div>
          <form action={formAction}>
            <input type="hidden" name="image_keys" value={JSON.stringify(selectedKeys)} />
            <button
              type="submit"
              disabled={isPending || !hasChanges}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                hasChanges
                  ? 'bg-accent hover:bg-accent/80 text-white'
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              } ${isPending ? 'opacity-50' : ''}`}
            >
              {isPending ? 'Saving...' : hasChanges ? 'Save Selection' : 'Saved'}
            </button>
          </form>
        </div>

        <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
          <span className="text-sm text-gray-300">
            <strong>{selectedKeys.length}</strong> of {images.length} images selected for carousel
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image) => {
            const key = image.key || image.id;
            const isSelected = selectedKeys.includes(key);
            const orderIndex = selectedKeys.indexOf(key);
            
            return (
              <div key={key} className="relative">
                <button
                  type="button"
                  onClick={() => toggleImage(key)}
                  className={`relative w-full aspect-[4/3] rounded-lg overflow-hidden border-4 transition-all ${
                    isSelected
                      ? 'border-accent ring-2 ring-accent ring-offset-2 ring-offset-gray-900'
                      : 'border-gray-600 opacity-50 hover:opacity-75 hover:border-gray-500'
                  }`}
                >
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover"
                  />
                  
                  {isSelected && (
                    <div className="absolute top-2 left-2 bg-accent text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                      {orderIndex + 1}
                    </div>
                  )}
                  
                  {!isSelected && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white text-sm font-medium">Click to add</span>
                    </div>
                  )}
                </button>
                
                {isSelected && (
                  <div className="absolute top-2 right-2 flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); moveUp(key); }}
                      disabled={orderIndex === 0}
                      className={`w-6 h-6 rounded bg-gray-800/80 text-white flex items-center justify-center text-xs ${
                        orderIndex === 0 ? 'opacity-30' : 'hover:bg-gray-700'
                      }`}
                      title="Move up"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); moveDown(key); }}
                      disabled={orderIndex === selectedKeys.length - 1}
                      className={`w-6 h-6 rounded bg-gray-800/80 text-white flex items-center justify-center text-xs ${
                        orderIndex === selectedKeys.length - 1 ? 'opacity-30' : 'hover:bg-gray-700'
                      }`}
                      title="Move down"
                    >
                      ▼
                    </button>
                  </div>
                )}
                
                <p className="mt-2 text-sm text-gray-400 truncate">{image.alt || key}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="admin-card p-4 text-sm text-gray-400">
        <p>
          <strong>How it works:</strong> Selected images will rotate in the homepage hero carousel.
          The numbered order determines the display sequence. Click an image to toggle it on/off.
          Use the arrows to reorder selected images.
        </p>
      </div>
    </div>
  );
}
