import raw from './gallery.json';
import type { GalleryItem } from '../lib/gallery-types';

// Cast the JSON import into the strongly-typed GalleryItem[] so callers get correct typings.
const gallery = raw as unknown as GalleryItem[];
export default gallery;
