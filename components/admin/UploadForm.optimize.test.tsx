import { optimizeImageFile, renameToWebp } from './UploadForm';

describe('renameToWebp', () => {
  it('appends webp extension when original name has no extension', () => {
    expect(renameToWebp('tattoo')).toBe('tattoo.webp');
  });

  it('replaces existing extension with webp', () => {
    expect(renameToWebp('artwork.jpeg')).toBe('artwork.webp');
  });
});

describe('optimizeImageFile', () => {
  const originalCreateImageBitmap = (window as any).createImageBitmap;
  const originalCreateElement = document.createElement.bind(document);

  afterEach(() => {
    (window as any).createImageBitmap = originalCreateImageBitmap;
    jest.restoreAllMocks();
  });

  it('returns null for non-image files', async () => {
    const file = new File(['hello'], 'greeting.txt', { type: 'text/plain' });
    const result = await optimizeImageFile(file);
    expect(result).toBeNull();
  });

  it('returns null when createImageBitmap throws and logs warning', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    (window as any).createImageBitmap = jest
      .fn()
      .mockRejectedValue(new Error('decoder failure'));

    const file = new File([new Uint8Array([1, 2, 3])], 'photo.jpg', { type: 'image/jpeg' });
    const result = await optimizeImageFile(file);

    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(
      'createImageBitmap failed; skipping client optimization',
      expect.any(Error),
    );
    warnSpy.mockRestore();
  });

  it('returns optimized file metadata when downscaling succeeds', async () => {
    const drawImage = jest.fn();
    const close = jest.fn();
    const toBlob = jest.fn((callback: BlobCallback) => {
      const blob = new Blob(['optimized'], { type: 'image/webp' });
      callback(blob);
    });

    (window as any).createImageBitmap = jest.fn().mockResolvedValue({
      width: 3600,
      height: 2400,
      close,
    });

    jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'canvas') {
        return {
          width: 0,
          height: 0,
          getContext: () => ({ drawImage }),
          toBlob,
        } as HTMLCanvasElement;
      }

      return originalCreateElement(tagName);
    });

    const file = new File([new Uint8Array([1, 2, 3, 4])], 'design.png', { type: 'image/png' });

    const result = await optimizeImageFile(file);

    expect(result).not.toBeNull();
    expect(result?.file.type).toBe('image/webp');
    expect(result?.file.name).toBe('design.webp');
    expect(result?.metadata.originalName).toBe('design.png');
    expect(result?.metadata.contentType).toBe('image/webp');
    expect(result?.metadata.width).toBeLessThan(3600);
    expect(result?.metadata.height).toBeLessThan(2400);
    expect(drawImage).toHaveBeenCalled();
    expect(close).toHaveBeenCalled();
  });
});
