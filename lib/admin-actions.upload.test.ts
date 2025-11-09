import { uploadGalleryAction } from './admin-actions';

jest.mock('./admin-auth', () => ({
  getAdminConfig: jest.fn(),
  createSessionToken: jest.fn(),
  getSessionCookieOptions: jest.fn().mockReturnValue({ name: 'ink-admin-session', options: {} }),
  isAdminEnabled: jest.fn(),
  verifySessionToken: jest.fn(),
}));

jest.mock('./r2-server', () => ({
  hasR2Credentials: jest.fn(),
  enqueueUploadJob: jest.fn(),
  processPendingUploadJobs: jest.fn(),
}));

jest.mock('./gallery-types', () => ({
  isGalleryCategory: jest.fn(),
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

const { isAdminEnabled, verifySessionToken } = jest.requireMock('./admin-auth');
const { hasR2Credentials, enqueueUploadJob, processPendingUploadJobs } = jest.requireMock('./r2-server');
const { isGalleryCategory } = jest.requireMock('./gallery-types');
const { cookies } = jest.requireMock('next/headers');
const { revalidatePath } = jest.requireMock('next/cache');

const createMockFile = (bytes: Uint8Array, name = 'artwork.jpg', type = 'image/jpeg') => {
  const file = new File([bytes], name, { type });
  const copy = bytes.slice();
  const buffer = copy.buffer.slice(copy.byteOffset, copy.byteOffset + copy.byteLength);
  Object.defineProperty(file, 'arrayBuffer', {
    value: jest.fn(async () => buffer),
  });
  return file;
};

describe('uploadGalleryAction', () => {
  const cookieStore = {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    cookieStore.get.mockReturnValue({ value: 'session-token' });
    (cookies as jest.Mock).mockResolvedValue(cookieStore);
    (isAdminEnabled as jest.Mock).mockReturnValue(true);
    (verifySessionToken as jest.Mock).mockReturnValue(true);
    (hasR2Credentials as jest.Mock).mockReturnValue(true);
    (isGalleryCategory as jest.Mock).mockReturnValue(true);
    (processPendingUploadJobs as jest.Mock).mockResolvedValue(undefined);
  });

  it('returns error when admin portal is disabled', async () => {
    (isAdminEnabled as jest.Mock).mockReturnValue(false);

    const result = await uploadGalleryAction(null, new FormData());

    expect(result).toEqual({ error: 'Admin portal is not configured' });
    expect(cookies).not.toHaveBeenCalled();
  });

  it('returns error when not authenticated', async () => {
    (verifySessionToken as jest.Mock).mockReturnValue(false);

    const result = await uploadGalleryAction(null, new FormData());

    expect(result).toEqual({ error: 'You must be signed in to upload images.' });
    expect(hasR2Credentials).not.toHaveBeenCalled();
  });

  it('returns error when R2 credentials are missing', async () => {
    (hasR2Credentials as jest.Mock).mockReturnValue(false);

    const result = await uploadGalleryAction(null, new FormData());

    expect(result).toEqual({ error: 'R2 storage is not configured.' });
    expect(enqueueUploadJob).not.toHaveBeenCalled();
    expect(processPendingUploadJobs).not.toHaveBeenCalled();
  });

  it('returns error for an invalid category', async () => {
    (isGalleryCategory as jest.Mock).mockReturnValue(false);
    const formData = new FormData();
    formData.set('category', 'unknown');

    const result = await uploadGalleryAction(null, formData);

    expect(result).toEqual({ error: 'Select a valid gallery category.' });
    expect(enqueueUploadJob).not.toHaveBeenCalled();
    expect(processPendingUploadJobs).not.toHaveBeenCalled();
  });

  it('returns error when no file is provided', async () => {
    const formData = new FormData();
    formData.set('category', 'healed');

    const result = await uploadGalleryAction(null, formData);

    expect(result).toEqual({ error: 'Upload requires an image file.' });
  });

  it('returns error when file is empty', async () => {
    const formData = new FormData();
    formData.set('category', 'healed');
    const emptyFile = new File([new Uint8Array(0)], 'empty.png', { type: 'image/png' });
    formData.set('file', emptyFile);

    const result = await uploadGalleryAction(null, formData);

    expect(result).toEqual({ error: 'The selected file is empty.' });
  });

  it('queues upload, processes immediately, trims metadata, and revalidates paths on success', async () => {
    const formData = new FormData();
    formData.set('category', 'flash');
    const file = createMockFile(Uint8Array.from([1, 2, 3]));
    formData.set('file', file);
    formData.set('alt', '  Inking  ');
    formData.set('caption', '  Sleeve  ');

    const result = await uploadGalleryAction(null, formData);

    expect(result).toEqual({ success: 'Upload queued and processing has started.' });
    expect(enqueueUploadJob).toHaveBeenCalledTimes(1);
    expect(enqueueUploadJob).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'flash',
        originalFilename: 'artwork.jpg',
        alt: 'Inking',
        caption: 'Sleeve',
        contentType: 'image/jpeg',
        clientOptimized: undefined,
      }),
    );
    expect(processPendingUploadJobs).toHaveBeenCalledWith({ limit: 25 });
    expect(revalidatePath).toHaveBeenCalledWith('/gallery', 'page');
    expect(revalidatePath).toHaveBeenCalledWith('/uploads', 'page');
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard', 'page');
  });

  it('passes client optimization metadata to the queue when provided', async () => {
    const formData = new FormData();
    formData.set('category', 'flash');
    const optimizedFile = createMockFile(Uint8Array.from([1, 2, 3]), 'optimized.webp', 'image/webp');
    formData.set('file', optimizedFile);
    formData.set('clientOptimized', 'true');
    formData.set('clientOriginalFilename', 'Original.JPG');
    formData.set('clientOriginalType', 'image/jpeg');
    formData.set('clientOptimizedWidth', '1200');
    formData.set('clientOptimizedHeight', '900');
    formData.set('clientOptimizedSize', '456789');
    formData.set('clientOptimizedContentType', 'image/webp');

    const result = await uploadGalleryAction(null, formData);

    expect(result).toEqual({ success: 'Upload queued and processing has started.' });
    expect(enqueueUploadJob).toHaveBeenCalledWith(
      expect.objectContaining({
        originalFilename: 'optimized.webp',
        contentType: 'image/webp',
        clientOptimized: {
          originalFilename: 'Original.JPG',
          originalContentType: 'image/jpeg',
          width: 1200,
          height: 900,
          size: 456789,
          contentType: 'image/webp',
        },
      }),
    );
  });

  it('logs when immediate processing fails but still returns success', async () => {
    (processPendingUploadJobs as jest.Mock).mockRejectedValueOnce(new Error('processing failed'));
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    const formData = new FormData();
    formData.set('category', 'flash');
    const file = createMockFile(Uint8Array.from([1, 2, 3]));
    formData.set('file', file);

    const result = await uploadGalleryAction(null, formData);

    expect(result).toEqual({ success: 'Upload queued and processing has started.' });
    expect(enqueueUploadJob).toHaveBeenCalledTimes(1);
    expect(enqueueUploadJob).toHaveBeenCalledWith(expect.objectContaining({ clientOptimized: undefined }));
    expect(processPendingUploadJobs).toHaveBeenCalledWith({ limit: 25 });
    expect(consoleError).toHaveBeenCalledWith('Failed to process queued upload job immediately', expect.any(Error));

    consoleError.mockRestore();
  });

  it('returns error when queueing throws', async () => {
    (enqueueUploadJob as jest.Mock).mockRejectedValueOnce(new Error('boom'));
    const formData = new FormData();
    formData.set('category', 'flash');
    const file = createMockFile(Uint8Array.from([1, 2, 3]));
    formData.set('file', file);

    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    const result = await uploadGalleryAction(null, formData);

    expect(result).toEqual({ error: 'Failed to queue upload. Please try again.' });
    expect(revalidatePath).not.toHaveBeenCalled();
    expect(processPendingUploadJobs).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });
});
