import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import SmartImage from '../../../components/SmartImage';
import {
  createSessionToken,
  getAdminConfig,
  getSessionCookieClearOptions,
  getSessionCookieOptions,
  isAdminEnabled,
  isValidAdminSlug,
  verifySessionToken,
} from '../../../lib/admin-auth';
import {
  GALLERY_CATEGORIES,
  type GalleryCategory,
  getCategoryLabel,
  isGalleryCategory,
} from '../../../lib/gallery-types';
import {
  deleteGalleryImage,
  hasR2Credentials,
  listGalleryImages,
  uploadGalleryImage,
} from '../../../lib/r2-server';

type AdminSearchParams = Record<string, string | string[] | undefined>;

// Use a permissive incoming props type to match Next's generated PageProps during CI builds.
// We'll narrow the shape locally to preserve type safety for the implementation.
type PageProps = any;

export const metadata: Metadata = {
  title: 'Gallery Admin Portal',
};

function resolveCategory(searchParams?: AdminSearchParams): GalleryCategory {
  const raw = typeof searchParams?.category === 'string' ? searchParams.category : undefined;
  return isGalleryCategory(raw ?? '') ? (raw as GalleryCategory) : 'healed';
}

function resolveFeedback(searchParams?: AdminSearchParams) {
  const rawStatus = typeof searchParams?.status === 'string' ? searchParams.status : undefined;
  const rawError = typeof searchParams?.error === 'string' ? searchParams.error : undefined;

  const statusMessage = rawStatus
    ? {
        uploaded: 'Image uploaded successfully.',
        deleted: 'Image deleted successfully.',
        logout: 'You have been signed out.',
        login: 'Signed in successfully.',
      }[rawStatus as keyof Record<string, string>]
    : undefined;

  const errorMessage = rawError
    ? {
        invalid: 'The password you entered was incorrect.',
        unauthorized: 'Your session has expired. Please sign in again.',
        upload_failed: 'Upload failed. Please try again with a supported image.',
        delete_failed: 'Delete failed. Please try again.',
      }[rawError as keyof Record<string, string>]
    : undefined;

  return {
    statusMessage,
    errorMessage,
  };
}

export default async function AdminPortalPage(props: PageProps) {
  const { params, searchParams } = props as { params: { admin?: string[] }; searchParams?: AdminSearchParams };
  if (!isAdminEnabled()) {
    notFound();
  }

  const slug = params.admin?.[0] ?? '';
  if (!isValidAdminSlug(slug)) {
    notFound();
  }

  const resolvedSearchParams = searchParams ?? undefined;

  const basePath = `/${slug}`;
  const category = resolveCategory(resolvedSearchParams);
  const feedback = resolveFeedback(resolvedSearchParams);

  const cookieStore = await cookies();
  const { name: sessionCookieName } = getSessionCookieOptions();
  const sessionToken = cookieStore.get(sessionCookieName)?.value ?? null;
  const authenticated = verifySessionToken(sessionToken);

  async function loginAction(formData: FormData) {
    'use server';

    const password = formData.get('password')?.toString() ?? '';
    const config = getAdminConfig();

    if (password !== config.password) {
      redirect(`${basePath}?error=invalid`);
    }

    const token = createSessionToken();
    const { name, options } = getSessionCookieOptions();
    const store = await cookies();
    store.set(name, token, options);
    redirect(`${basePath}?status=login`);
  }

  async function logoutAction() {
    'use server';

    const { name, options } = getSessionCookieClearOptions();
    const store = await cookies();
    store.set(name, '', options);
    redirect(`${basePath}?status=logout`);
  }

  async function ensureAuthenticated() {
    'use server';

    const { name } = getSessionCookieOptions();
    const store = await cookies();
    const token = store.get(name)?.value ?? null;
    if (!verifySessionToken(token)) {
      redirect(`${basePath}?error=unauthorized`);
    }
  }

  async function uploadAction(formData: FormData) {
    'use server';

    await ensureAuthenticated();

    const categoryValue = formData.get('category')?.toString() ?? '';
    if (!isGalleryCategory(categoryValue)) {
      redirect(`${basePath}?error=upload_failed`);
    }

    const file = formData.get('file');
    if (!(file instanceof File) || file.size === 0) {
      redirect(`${basePath}?category=${categoryValue}&error=upload_failed`);
    }

    const alt = formData.get('alt')?.toString() || undefined;
    const caption = formData.get('caption')?.toString() || undefined;

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      await uploadGalleryImage({
        category: categoryValue,
        originalFilename: file.name,
        buffer,
        alt,
        caption,
      });
    } catch (error) {
      console.error('Failed to upload image', error);
      redirect(`${basePath}?category=${categoryValue}&error=upload_failed`);
    }

    revalidatePath(basePath);
    redirect(`${basePath}?category=${categoryValue}&status=uploaded`);
  }

  async function deleteAction(formData: FormData) {
    'use server';

    await ensureAuthenticated();

    const categoryValue = formData.get('category')?.toString() ?? '';
    const key = formData.get('key')?.toString() ?? '';

    if (!isGalleryCategory(categoryValue) || !key) {
      redirect(`${basePath}?error=delete_failed`);
    }

    try {
      await deleteGalleryImage(key, categoryValue);
    } catch (error) {
      console.error('Failed to delete image', error);
      redirect(`${basePath}?category=${categoryValue}&error=delete_failed`);
    }

    revalidatePath(basePath);
    redirect(`${basePath}?category=${categoryValue}&status=deleted`);
  }

  if (!authenticated) {
    return (
      <div className="admin-shell admin-shell--compact">
        <section className="card admin-card">
          <h1>Secure admin access</h1>
          <p className="text-muted">Enter the shared portal password to manage gallery assets and review uploads.</p>
          {feedback.errorMessage && (
            <section className="admin-alert admin-alert--error">
              <output aria-live="assertive">{feedback.errorMessage}</output>
            </section>
          )}
          <form action={loginAction} className="admin-form" autoComplete="on">
            <div className="admin-field">
              <label htmlFor="password">Portal password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                aria-describedby="admin-password-hint"
              />
              <p id="admin-password-hint" className="admin-field__hint">
                Passwords are case-sensitive. Reach out to the studio lead if you need access.
              </p>
            </div>
            <div className="admin-form__actions">
              <button className="btn btn--primary" type="submit">
                Sign in
              </button>
            </div>
          </form>
        </section>
      </div>
    );
  }

  const items = await listGalleryImages(category);
  const canMutate = hasR2Credentials();

  return (
    <div className="admin-shell">
      <header className="admin-card admin-header">
        <div>
          <h1>Gallery admin portal</h1>
          <p className="text-muted">Manage R2-backed gallery assets with automatic optimization and quick cleanup tools.</p>
        </div>
        <form action={logoutAction} className="admin-header__actions">
          <button type="submit" className="btn btn--secondary">Sign out</button>
        </form>
      </header>

      {!canMutate && (
        <section className="admin-card admin-card--warning">
          <h2>Missing R2 credentials</h2>
          <p>
            Uploads and deletions are disabled until <code>R2_ACCOUNT_ID</code>, <code>R2_BUCKET</code>, <code>R2_ACCESS_KEY_ID</code>, and
            {' '}<code>R2_SECRET_ACCESS_KEY</code> are provided in the environment.
          </p>
        </section>
      )}

      {(feedback.statusMessage || feedback.errorMessage) && (
        <section className={`admin-alert ${feedback.errorMessage ? 'admin-alert--error' : 'admin-alert--success'}`}>
          <output aria-live="polite">{feedback.errorMessage ?? feedback.statusMessage}</output>
        </section>
      )}

      <section className="admin-card">
        <div className="admin-card__header">
          <h2>Upload new artwork</h2>
          <p className="text-muted">Choose a gallery category and add a high-resolution image. We&apos;ll handle the optimization for you.</p>
        </div>
        <form action={uploadAction} className="admin-form">
          <div className="admin-form__row admin-form__row--columns-2">
            <div className="admin-field">
              <label htmlFor="category">Category</label>
              <select id="category" name="category" defaultValue={category} disabled={!canMutate}>
                {GALLERY_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {getCategoryLabel(cat)}
                  </option>
                ))}
              </select>
            </div>
            <div className="admin-field">
              <label htmlFor="file">Image file</label>
              <input id="file" type="file" name="file" accept="image/*" required disabled={!canMutate} />
              <p className="admin-field__hint">Large uploads are auto-rotated, resized, and converted to WebP.</p>
            </div>
          </div>
          <div className="admin-form__row admin-form__row--columns-2">
            <div className="admin-field">
              <label htmlFor="alt">Alt text</label>
              <input id="alt" type="text" name="alt" placeholder="Describe the artwork" maxLength={256} disabled={!canMutate} />
              <p className="admin-field__hint">Used for accessibility and shown beneath the image when no caption is provided.</p>
            </div>
            <div className="admin-field">
              <label htmlFor="caption">Caption (optional)</label>
              <input id="caption" type="text" name="caption" maxLength={256} disabled={!canMutate} />
              <p className="admin-field__hint">Appears with the artwork in the gallery layout.</p>
            </div>
          </div>
          <div className="admin-form__actions">
            <button className="btn btn--primary" type="submit" disabled={!canMutate}>
              Upload image
            </button>
          </div>
        </form>
      </section>

      <section className="admin-card admin-gallery">
        <div className="admin-card__header">
          <h2>{getCategoryLabel(category)} gallery</h2>
          <p className="text-muted">Browse previously uploaded artwork and remove items that no longer belong.</p>
        </div>
        <nav className="admin-category-nav" aria-label="Gallery categories">
          {GALLERY_CATEGORIES.map((cat) => {
            const isActive = cat === category;
            return (
              <a
                key={cat}
                href={`${basePath}?category=${cat}`}
                className={`admin-category-nav__link ${isActive ? 'is-active' : ''}`}
              >
                {getCategoryLabel(cat)}
              </a>
            );
          })}
        </nav>

        {items.length === 0 ? (
          <p className="admin-empty-state">No artwork uploaded yet for this category.</p>
        ) : (
          <ul className="admin-gallery__grid">
            {items.map((item) => (
              <li key={item.id} className="admin-gallery__item">
                <div className="admin-gallery__preview">
                  <SmartImage
                    src={item.src}
                    alt={item.alt}
                    fill
                    sizes="(min-width: 768px) 300px, 100vw"
                    className="admin-gallery__image"
                  />
                </div>
                <div className="admin-gallery__meta">
                  <strong>{item.caption || item.alt}</strong>
                  <p className="text-muted">
                    {item.size ? `${(item.size / 1024).toFixed(1)} KB • ` : ''}
                    {item.lastModified ? new Date(item.lastModified).toLocaleString() : 'Uploaded'}
                  </p>
                  <p className="admin-field__hint" style={{ wordBreak: 'break-all' }}>{item.key ?? 'Fallback item'}</p>
                </div>
                <div className="admin-gallery__actions">
                  <a className="btn btn--secondary" href={item.src} target="_blank" rel="noreferrer">
                    View
                  </a>
                  <form action={deleteAction}>
                    <input type="hidden" name="category" value={category} />
                    <input type="hidden" name="key" value={item.key ?? ''} />
                    <button className="btn btn--danger" type="submit" disabled={!canMutate || !item.key}>
                      Delete
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
