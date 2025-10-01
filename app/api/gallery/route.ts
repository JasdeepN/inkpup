import { NextResponse } from 'next/server';
import { listGalleryImages } from '../../../lib/r2-server';
import { GALLERY_CATEGORIES, isGalleryCategory } from '../../../lib/gallery-types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categoryParam = searchParams.get('category') ?? 'healed';

  if (!isGalleryCategory(categoryParam)) {
    return NextResponse.json(
      {
        error: 'Invalid category',
        categories: GALLERY_CATEGORIES,
      },
      { status: 400 }
    );
  }

  try {
    const items = await listGalleryImages(categoryParam);
    return NextResponse.json({ items });
  } catch (error) {
    console.error('Gallery API error', error);
    return NextResponse.json({ error: 'Unable to load gallery images.' }, { status: 500 });
  }
}
