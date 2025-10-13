import { sniffContentType } from './r2-server';

describe('sniffContentType', () => {
  it('detects JPEG buffer', () => {
    const buf = Buffer.from([0xff, 0xd8, 0xff, ...new Array(9).fill(0)]);
    expect(sniffContentType(buf)).toEqual({ contentType: 'image/jpeg', ext: 'jpg' });
  });

  it('detects PNG buffer', () => {
    const buf = Buffer.from([0x89, 0x50, 0x4e, 0x47, ...new Array(8).fill(0)]);
    expect(sniffContentType(buf)).toEqual({ contentType: 'image/png', ext: 'png' });
  });

  it('detects GIF buffer', () => {
    const buf = Buffer.from([0x47, 0x49, 0x46, 0x38, ...new Array(8).fill(0)]);
    expect(sniffContentType(buf)).toEqual({ contentType: 'image/gif', ext: 'gif' });
  });

  it('detects WEBP buffer', () => {
    const buf = Buffer.from([0x52, 0x49, 0x46, 0x46, 0,0,0,0, 0x57, 0x45, 0x42, 0x50]);
    expect(sniffContentType(buf)).toEqual({ contentType: 'image/webp', ext: 'webp' });
  });

  it('detects .webp filename', () => {
    expect(sniffContentType(Buffer.alloc(12), 'file.webp')).toEqual({ contentType: 'image/webp', ext: 'webp' });
  });

  it('detects .png filename', () => {
    expect(sniffContentType(Buffer.alloc(12), 'file.png')).toEqual({ contentType: 'image/png', ext: 'png' });
  });

  it('detects .gif filename', () => {
    expect(sniffContentType(Buffer.alloc(12), 'file.gif')).toEqual({ contentType: 'image/gif', ext: 'gif' });
  });

  it('detects .jpg filename', () => {
    expect(sniffContentType(Buffer.alloc(12), 'file.jpg')).toEqual({ contentType: 'image/jpeg', ext: 'jpg' });
  });

  it('detects .jpeg filename', () => {
    expect(sniffContentType(Buffer.alloc(12), 'file.jpeg')).toEqual({ contentType: 'image/jpeg', ext: 'jpg' });
  });

  it('returns default for unknown', () => {
    expect(sniffContentType(Buffer.alloc(12), 'file.unknown')).toEqual({ contentType: 'application/octet-stream', ext: 'bin' });
    expect(sniffContentType(Buffer.alloc(12))).toEqual({ contentType: 'application/octet-stream', ext: 'bin' });
  });
});
