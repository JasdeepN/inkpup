'use client';

import { useActionState } from 'react';
import Image from 'next/image';
import {
  setActiveHeroAction,
  type ActionState,
} from '../../../lib/admin-actions-pricing';
import type { GalleryItem } from '../../../lib/gallery-types';

interface HeroClientProps {
  images: GalleryItem[];
  activeHeroId: string | null;
}

export default function HeroClient({ images, activeHeroId }: HeroClientProps) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    setActiveHeroAction,
    null
  );

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

  return (
    <div className="space-y-6">
      {state?.error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-2 rounded">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="bg-green-900/50 border border-green-500 text-green-200 px-4 py-2 rounded">
          Hero image updated successfully!
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image) => {
          const isActive = image.id === activeHeroId;
          return (
            <form key={image.id} action={formAction}>
              <input type="hidden" name="hero_id" value={image.id} />
              <button
                type="submit"
                disabled={isPending || isActive}
                className={`relative w-full aspect-[4/3] rounded-lg overflow-hidden border-4 transition-all ${
                  isActive
                    ? 'border-accent ring-2 ring-accent ring-offset-2 ring-offset-gray-900'
                    : 'border-transparent hover:border-gray-500'
                } ${isPending ? 'opacity-50' : ''}`}
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover"
                />
                {isActive && (
                  <div className="absolute inset-0 bg-accent/20 flex items-center justify-center">
                    <span className="bg-accent text-white px-3 py-1 rounded-full text-sm font-medium">
                      Active
                    </span>
                  </div>
                )}
              </button>
              <p className="mt-2 text-sm text-gray-400 truncate">{image.alt || image.id}</p>
            </form>
          );
        })}
      </div>

      <div className="admin-card p-4 text-sm text-gray-400">
        <p>
          <strong>Note:</strong> The selected hero image will be displayed on the homepage.
          Click on an image to set it as the active hero.
        </p>
      </div>
    </div>
  );
}
