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
    const { items, isFallback, fallbackReason, usedBundledFallback, credentialStatus } = await listGalleryImages(categoryParam);
    return NextResponse.json({
      items,
      fallback: isFallback,
      fallbackReason,
      usedBundledFallback,
      credentialStatus,
    });
  } catch (error) {
    console.error('Gallery API error', error);
    const flag = process.env.ALLOW_BUNDLED_GALLERY_FALLBACK?.trim().toLowerCase();
    const bundledAllowed = process.env.NODE_ENV === 'test' || flag === 'true' || flag === '1';
    const fallbackItems = bundledAllowed ? getFallbackGalleryItems(categoryParam) : [];
    return NextResponse.json(
      {
        items: fallbackItems,
        fallback: true,
        fallbackReason: 'unexpected_error',
        usedBundledFallback: fallbackItems.length > 0,
        credentialStatus: {
          accountId: Boolean(process.env.R2_ACCOUNT_ID?.trim()),
          bucket: Boolean(process.env.R2_BUCKET?.trim()),
          accessKey: Boolean(process.env.R2_ACCESS_KEY_ID?.trim()),
          secretAccessKey: Boolean(process.env.R2_SECRET_ACCESS_KEY?.trim() || process.env.R2_API_TOKEN?.trim()),
        },
        error: bundledAllowed
          ? 'Unable to load gallery images from R2. Serving bundled fallback data.'
          : 'Unable to load gallery images from R2 and bundled fallbacks are disabled in this environment.',
      },
      { status: 200 }
    );
  }
}
