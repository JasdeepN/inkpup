'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  getAdminConfig,
  createSessionToken,
  getSessionCookieOptions,
  isAdminEnabled,
  verifySessionToken,
} from './admin-auth';
import { isGalleryCategory, type GalleryCategory } from './gallery-types';
import { hasR2Credentials, enqueueUploadJob, processPendingUploadJobs } from './r2-server';

export type LoginState = {
  error?: string;
} | null;

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const password = formData.get('password');

  if (!isAdminEnabled()) {
    return { error: 'Admin portal is not configured' };
  }

  const config = getAdminConfig();

  if (password !== config.password) {
    return { error: 'Invalid password' };
  }

  const sessionToken = createSessionToken();
  const { name, options } = getSessionCookieOptions();

  const cookieStore = await cookies();
  cookieStore.set(name, sessionToken, options);

  redirect('/dashboard');
}

export type UploadState = {
  error?: string;
  success?: string;
} | null;

async function fileToBuffer(file: File): Promise<Buffer> {
  if (typeof file.arrayBuffer === 'function') {
    const arrayBuffer = await file.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  try {
    const response = new Response(file as unknown as BodyInit);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    // fall through to additional fallbacks
  }

  const anyFile = file as unknown as {
    stream?: () => ReadableStream | AsyncIterable<unknown> | NodeJS.ReadableStream;
    text?: () => Promise<string>;
    size?: number;
  };

  if (typeof anyFile.stream === 'function') {
    const stream = anyFile.stream();
    const buffers: Buffer[] = [];

    if (stream && typeof (stream as any).getReader === 'function') {
      const reader = (stream as ReadableStream<Uint8Array>).getReader();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          buffers.push(Buffer.from(value));
        }
      }
    } else if (stream && typeof (stream as any)[Symbol.asyncIterator] === 'function') {
      for await (const chunk of stream as AsyncIterable<unknown>) {
        if (chunk === undefined || chunk === null) continue;
        buffers.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as any));
      }
    }

    if (buffers.length > 0) {
      return Buffer.concat(buffers);
    }
  }

  if (typeof anyFile.text === 'function') {
    const text = await anyFile.text();
    return Buffer.from(text);
  }

  if (typeof anyFile.size === 'number' && anyFile.size === 0) {
    return Buffer.alloc(0);
  }

  throw new Error('Unsupported file implementation for upload.');
}

export async function uploadGalleryAction(_prevState: UploadState, formData: FormData): Promise<UploadState> {
  if (!isAdminEnabled()) {
    return { error: 'Admin portal is not configured' };
  }

  const cookieStore = await cookies();
  const { name: cookieName } = getSessionCookieOptions();
  const sessionToken = cookieStore.get(cookieName)?.value ?? null;
  const authenticated = verifySessionToken(sessionToken);

  if (!authenticated) {
    return { error: 'You must be signed in to upload images.' };
  }

  if (!hasR2Credentials()) {
    return { error: 'R2 storage is not configured.' };
  }

  const categoryValue = formData.get('category');
  if (typeof categoryValue !== 'string' || !isGalleryCategory(categoryValue)) {
    return { error: 'Select a valid gallery category.' };
  }
  const category = categoryValue as GalleryCategory;

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return { error: 'Upload requires an image file.' };
  }

  if (file.size === 0) {
    return { error: 'The selected file is empty.' };
  }

  const clientOptimized = formData.get('clientOptimized') === 'true';
  const originalFilenameRaw = formData.get('clientOriginalFilename');
  const originalTypeRaw = formData.get('clientOriginalType');
  const optimizedWidthRaw = formData.get('clientOptimizedWidth');
  const optimizedHeightRaw = formData.get('clientOptimizedHeight');
  const optimizedSizeRaw = formData.get('clientOptimizedSize');
  const optimizedContentTypeRaw = formData.get('clientOptimizedContentType');

  const parsedOriginalFilename = typeof originalFilenameRaw === 'string' && originalFilenameRaw.trim().length
    ? originalFilenameRaw.trim()
    : undefined;
  const parsedOriginalType = typeof originalTypeRaw === 'string' && originalTypeRaw.trim().length
    ? originalTypeRaw.trim()
    : undefined;

  const parseDimension = (value: FormDataEntryValue | null) => {
    if (typeof value !== 'string') return undefined;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
    return Math.round(parsed);
  };

  const parseSize = (value: FormDataEntryValue | null) => {
    if (typeof value !== 'string') return undefined;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
    return Math.round(parsed);
  };

  const parsedWidth = parseDimension(optimizedWidthRaw);
  const parsedHeight = parseDimension(optimizedHeightRaw);
  const parsedSize = parseSize(optimizedSizeRaw);
  const optimizedContentType = typeof optimizedContentTypeRaw === 'string' && optimizedContentTypeRaw.trim().length
    ? optimizedContentTypeRaw.trim()
    : undefined;

  let buffer: Buffer;
  try {
    buffer = await fileToBuffer(file);
  } catch (error) {
    console.error('Failed to read gallery upload file', error);
    return { error: 'Failed to read the uploaded file. Please try again.' };
  }

  const altRaw = formData.get('alt');
  const captionRaw = formData.get('caption');
  const alt = typeof altRaw === 'string' && altRaw.trim().length ? altRaw.trim() : undefined;
  const caption = typeof captionRaw === 'string' && captionRaw.trim().length ? captionRaw.trim() : undefined;

  try {
    await enqueueUploadJob({
      category,
      originalFilename: file.name || 'upload',
      buffer,
      alt,
      caption,
      contentType: file.type || 'application/octet-stream',
      clientOptimized: clientOptimized
        ? {
            originalFilename: parsedOriginalFilename,
            originalContentType: parsedOriginalType,
            width: parsedWidth,
            height: parsedHeight,
            size: parsedSize,
            contentType: optimizedContentType ?? file.type ?? 'image/webp',
          }
        : undefined,
    });
  } catch (error) {
    console.error('Failed to enqueue gallery upload job', error);
    return { error: 'Failed to queue upload. Please try again.' };
  }

  try {
    await processPendingUploadJobs({ limit: 25 });
  } catch (error) {
    console.error('Failed to process queued upload job immediately', error);
  }

  revalidatePath('/gallery', 'page');
  revalidatePath('/uploads', 'page');
  revalidatePath('/dashboard', 'page');

  return { success: 'Upload queued and processing has started.' };
}

export async function logoutAction() {
  const { name } = getSessionCookieOptions();
  const cookieStore = await cookies();
  cookieStore.delete(name);
  redirect('/?logged_out=true');
}
