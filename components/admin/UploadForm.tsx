'use client';
import React, { useEffect, useRef, useState } from 'react';
import { uploadGalleryAction, type UploadState } from '../../lib/admin-actions';
import { GALLERY_CATEGORIES, getCategoryLabel } from '../../lib/gallery-types';

const INITIAL_STATE: UploadState = null;
const MAX_OPTIMIZED_WIDTH = Number(process.env.NEXT_PUBLIC_R2_MAX_IMAGE_WIDTH ?? 1800);
const WEBP_QUALITY = 0.82;

async function optimizeImageFile(file: File) {
  if (typeof window === 'undefined') return null;
  if (!file.type.startsWith('image/')) return null;

  const supportsImageBitmap = typeof window.createImageBitmap === 'function';
  if (!supportsImageBitmap) {
    return null;
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await window.createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch (error) {
    console.warn('createImageBitmap failed; skipping client optimization', error);
    return null;
  }

  const scale = bitmap.width > MAX_OPTIMIZED_WIDTH ? MAX_OPTIMIZED_WIDTH / bitmap.width : 1;
  if (file.type === 'image/webp' && scale >= 1) {
    bitmap.close();
    return null;
  }

  const targetWidth = Math.max(1, Math.round(bitmap.width * scale));
  const targetHeight = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const context = canvas.getContext('2d');

  if (!context) {
    bitmap.close();
    return null;
  }

  context.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(
      (result) => {
        resolve(result);
      },
      'image/webp',
      WEBP_QUALITY,
    );
  });

  if (!blob) {
    return null;
  }

  const optimizedFile = new File([blob], renameToWebp(file.name), { type: 'image/webp' });
  return {
    file: optimizedFile,
    metadata: {
      width: targetWidth,
      height: targetHeight,
      size: blob.size,
      originalName: file.name,
      originalType: file.type,
      contentType: optimizedFile.type,
    },
  };
}

function renameToWebp(originalName: string) {
  const dotIndex = originalName.lastIndexOf('.');
  if (dotIndex === -1) {
    return `${originalName}.webp`;
  }
  return `${originalName.slice(0, dotIndex)}.webp`;
}

function UploadForm({
  canMutate = true,
  category,
}: {
  canMutate?: boolean;
  category: string;
}) {
  const [state, setState] = useState<UploadState>(INITIAL_STATE);
  const [isSubmitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state?.success]);

  const handleAction = async (formData: FormData) => {
    if (!canMutate || isSubmitting) {
      return;
    }

    setSubmitting(true);
    try {
      const file = formData.get('file');
      if (file instanceof File) {
        try {
          const optimized = await optimizeImageFile(file);
          if (optimized) {
            formData.set('file', optimized.file);
            formData.set('clientOptimized', 'true');
            formData.set('clientOriginalFilename', optimized.metadata.originalName);
            formData.set('clientOriginalType', optimized.metadata.originalType);
            formData.set('clientOptimizedWidth', String(optimized.metadata.width));
            formData.set('clientOptimizedHeight', String(optimized.metadata.height));
            formData.set('clientOptimizedSize', String(optimized.metadata.size));
            formData.set('clientOptimizedContentType', optimized.metadata.contentType);
          }
        } catch (error) {
          console.warn('Client-side optimization failed; uploading original file', error);
        }
      }

      const result = await uploadGalleryAction(state, formData);
      setState(result);
    } catch (error) {
      console.error('Upload form submission failed', error);
      setState({ error: 'Failed to submit upload. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const inputsDisabled = !canMutate || isSubmitting;

  return (
    <form
      ref={formRef}
      action={handleAction}
      className="admin-form"
      data-testid="upload-form"
    >
      {!canMutate && (
        <p className="admin-field__hint text-red-600" role="alert">
          Uploads are disabled until storage credentials are configured.
        </p>
      )}
      {state?.error && (
        <p className="admin-field__hint text-red-600" role="alert">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="admin-field__hint text-green-600" role="status">
          {state.success}
        </p>
      )}
      <FormFields
        disabled={inputsDisabled}
        category={category}
        pending={isSubmitting}
      />
    </form>
  );
}

function FormFields({
  disabled,
  category,
  pending,
}: {
  disabled: boolean;
  category: string;
  pending: boolean;
}) {
  return (
    <>
      <div className="admin-form__row admin-form__row--columns-2">
        <div className="admin-field">
          <label htmlFor="category">Category</label>
          <select id="category" name="category" defaultValue={category} disabled={disabled}>
            {GALLERY_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {getCategoryLabel(cat)}
              </option>
            ))}
          </select>
        </div>
        <div className="admin-field">
          <label htmlFor="file">Image file</label>
          <input id="file" type="file" name="file" accept="image/*" required disabled={disabled} />
          <p className="admin-field__hint">Large uploads are auto-rotated, resized, and converted to WebP.</p>
        </div>
      </div>
      <div className="admin-form__row admin-form__row--columns-2">
        <div className="admin-field">
          <label htmlFor="alt">Alt text</label>
          <input id="alt" type="text" name="alt" placeholder="Describe the artwork" maxLength={256} disabled={disabled} />
          <p className="admin-field__hint">Used for accessibility and shown beneath the image when no caption is provided.</p>
        </div>
        <div className="admin-field">
          <label htmlFor="caption">Caption (optional)</label>
          <input id="caption" type="text" name="caption" maxLength={256} disabled={disabled} />
          <p className="admin-field__hint">Appears with the artwork in the gallery layout.</p>
        </div>
      </div>
      <div className="admin-form__actions">
        <button className="btn btn--primary" type="submit" disabled={disabled}>
          {pending ? 'Uploading…' : 'Upload image'}
        </button>
      </div>
    </>
  );
}

export { optimizeImageFile, renameToWebp };
export default UploadForm;
