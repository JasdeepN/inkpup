
import { NextResponse } from 'next/server';
import { getD1Binding, getAllGalleryImages, insertGalleryImage, deleteGalleryImage } from '../../../../lib/db/d1';
import { GalleryItem } from '../../../../lib/gallery-types';

export async function GET() {
  try {
    const db = getD1Binding();
    if (!db) {
      return NextResponse.json({ error: 'D1 binding not found' }, { status: 500 });
    }

    const images = await getAllGalleryImages(db);
    return NextResponse.json({ images });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = getD1Binding();
    if (!db) {
      return NextResponse.json({ error: 'D1 binding not found' }, { status: 500 });
    }

    const body = await request.json() as any;
    const item: GalleryItem = {
      id: body.id || `test-${Date.now()}`,
      key: body.key || `test-key-${Date.now()}`,
      src: body.src || 'https://example.com/test.jpg',
      alt: body.alt || 'Test Image',
      category: body.category || 'art',
      width: body.width || 800,
      height: body.height || 600,
      size: body.size || 1024,
      lastModified: new Date().toISOString(),
    };

    await insertGalleryImage(db, item);
    return NextResponse.json({ success: true, item });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const db = getD1Binding();
    if (!db) {
      return NextResponse.json({ error: 'D1 binding not found' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 });
    }

    await deleteGalleryImage(db, key);
    return NextResponse.json({ success: true, key });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
