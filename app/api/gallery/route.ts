import { NextResponse } from 'next/server';
import { getFallbackGalleryItems, listGalleryImages } from '../../../lib/r2-server';
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
    const { items, isFallback, fallbackReason } = await listGalleryImages(categoryParam);
    return NextResponse.json({
      items,
      fallback: isFallback,
      fallbackReason,
    });
  } catch (error) {
    console.error('Gallery API error', error);
    const fallbackItems = getFallbackGalleryItems(categoryParam);
    return NextResponse.json(
      {
        items: fallbackItems,
        fallback: true,
        fallbackReason: 'unexpected_error',
        error: 'Unable to load gallery images from R2. Serving bundled fallback data.',
      },
      { status: 200 }
    );
  }
}
