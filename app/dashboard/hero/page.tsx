import { getD1Binding, getSetting, getAllGalleryImages } from '../../../lib/db/d1';
import HeroClient from './HeroClient';
import { D1UnavailableNotice } from '../../../components/admin/D1UnavailableNotice';

export const metadata = {
  title: 'Hero Image | Admin',
  description: 'Select the active hero image for the homepage',
};

export default async function HeroPage() {
  const db = getD1Binding();
  const isD1Available = !!db;
  
  // Get all images from D1 that are in the hero category
  const allImages = db ? await getAllGalleryImages(db) : [];
  const heroImages = allImages.filter((img) => img.category === 'hero');
  
  // Get current active hero ID from site settings
  const activeHeroId = db ? await getSetting(db, 'active_hero_id') : null;

  return (
    <div className="space-y-6">
      <D1UnavailableNotice 
        isAvailable={isD1Available}
        affectedFeatures={[
          'Hero image selection',
          'Gallery image listing',
          'Active hero persistence'
        ]}
      />
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Hero Image Selector</h1>
          <p className="text-gray-400 mt-1">
            Choose which image to display in the homepage hero section
          </p>
        </div>
      </div>

      <HeroClient images={heroImages} activeHeroId={activeHeroId} />
    </div>
  );
}
