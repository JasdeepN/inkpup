import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import SmartImage from '../../../components/SmartImage';
import {
  createSessionToken,
  getAdminConfig,
  getSessionCookieClearOptions,
  getSessionCookieOptions,
  isAdminEnabled,
  verifySessionToken,
} from '../../../lib/admin-auth';
import { ADMIN_INTERNAL_PATH, ADMIN_PUBLIC_BASE_PATH, isAdminHost } from '../../../lib/admin-hosts';
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

// In Next.js 15, searchParams is asynchronous and must be awaited.
type PageProps = { searchParams?: Promise<AdminSearchParams> };

export const metadata: Metadata = {
  title: 'Gallery Admin Portal',
};

const ADMIN_REVALIDATE_PATH = ADMIN_INTERNAL_PATH;
const ADMIN_BASE_PATH = ADMIN_PUBLIC_BASE_PATH;

function resolveCategory(searchParams?: AdminSearchParams): GalleryCategory {
  const raw = typeof searchParams?.category === 'string' ? searchParams.category : undefined;
  return isGalleryCategory(raw ?? '') ? (raw as GalleryCategory) : 'healed';
}

function resolveFeedback(searchParams?: AdminSearchParams) {
  const rawStatus = typeof searchParams?.status === 'string' ? searchParams.status : undefined;
  const rawError = typeof searchParams?.error === 'string' ? searchParams.error : undefined;

  const statusMap: Record<string, string> = {
    uploaded: 'Image uploaded successfully.',
    deleted: 'Image deleted successfully.',
    logout: 'You have been signed out.',
    login: 'Signed in successfully.',
  };

  const errorMap: Record<string, string> = {
    invalid: 'The password you entered was incorrect.',
    unauthorized: 'Your session has expired. Please sign in again.',
    upload_failed: 'Upload failed. Please try again with a supported image.',
    delete_failed: 'Delete failed. Please try again.',
  };

  const statusMessage = rawStatus ? statusMap[rawStatus] : undefined;
  const errorMessage = rawError ? errorMap[rawError] : undefined;

  return { statusMessage, errorMessage };
}

export default async function AdminPortalPage(props: PageProps) {
  if (!isAdminEnabled()) {
    notFound();
  }

  // Only allow access from admin subdomains
  const headerStore = await headers();
  const hostHeader = headerStore.get('host');
  // Accept only admin subdomains, e.g. admin.devapp.lan, admin.inkpup.com, etc.
  if (!hostHeader || !isAdminHost(hostHeader)) {
    notFound();
  }

  // Await the async searchParams to avoid the sync-dynamic-apis error in Next 15
  const resolvedSearchParams = props.searchParams ? await props.searchParams : undefined;

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
      redirect(`${ADMIN_BASE_PATH}?error=invalid`);
    }

    const token = createSessionToken();
    const { name, options } = getSessionCookieOptions();
    const store = await cookies();
    store.set(name, token, options);
    redirect(`${ADMIN_BASE_PATH}?status=login`);
  }

  async function logoutAction() {
    'use server';

    const { name, options } = getSessionCookieClearOptions();
    const store = await cookies();
    store.set(name, '', options);
    redirect(`${ADMIN_BASE_PATH}?status=logout`);
  }

  async function ensureAuthenticated() {
    'use server';

    const { name } = getSessionCookieOptions();
    const store = await cookies();
    const token = store.get(name)?.value ?? null;
    if (!verifySessionToken(token)) {
      redirect(`${ADMIN_BASE_PATH}?error=unauthorized`);
    }
  }

  async function uploadAction(formData: FormData) {
    'use server';

    await ensureAuthenticated();

    const categoryValue = formData.get('category')?.toString() ?? '';
    if (!isGalleryCategory(categoryValue)) {
      redirect(`${ADMIN_BASE_PATH}?error=upload_failed`);
    }

    const file = formData.get('file');
    if (!(file instanceof File) || file.size === 0) {
      redirect(`${ADMIN_BASE_PATH}?category=${categoryValue}&error=upload_failed`);
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
      redirect(`${ADMIN_BASE_PATH}?category=${categoryValue}&error=upload_failed`);
    }

    revalidatePath(ADMIN_REVALIDATE_PATH);
    redirect(`${ADMIN_BASE_PATH}?category=${categoryValue}&status=uploaded`);
  }

  async function deleteAction(formData: FormData) {
    'use server';

    await ensureAuthenticated();

    const categoryValue = formData.get('category')?.toString() ?? '';
    const key = formData.get('key')?.toString() ?? '';

    if (!isGalleryCategory(categoryValue) || !key) {
      redirect(`${ADMIN_BASE_PATH}?error=delete_failed`);
    }

    try {
      await deleteGalleryImage(key, categoryValue);
    } catch (error) {
      console.error('Failed to delete image', error);
      redirect(`${ADMIN_BASE_PATH}?category=${categoryValue}&error=delete_failed`);
    }

    revalidatePath(ADMIN_REVALIDATE_PATH);
    redirect(`${ADMIN_BASE_PATH}?category=${categoryValue}&status=deleted`);
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

  const {
    items,
    isFallback: isFallbackGallery,
    fallbackReason,
    usedBundledFallback,
    credentialStatus,
  } = await listGalleryImages(category).asPromise();
  const canMutate = hasR2Credentials();
  const fallbackDetail = (() => {
    switch (fallbackReason) {
      case 'missing_credentials':
        return 'Provide a Cloudflare R2 binding (R2_BUCKET) or configure R2 credentials to restore live syncing.';
      case 'client_initialization_failed':
        return 'The R2 client failed to initialize; check API credentials and network access.';
      case 'r2_fetch_failed':
        return 'Requests to Cloudflare R2 are failing; review storage status in the dashboard.';
      default:
        return null;
    }
  })();

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
          <h2>Cloudflare R2 not configured</h2>
          <p>
            Uploads and deletions are disabled until a Cloudflare R2 binding <code>R2_BUCKET</code> is available at runtime, or environment
            credentials are configured: <code>R2_ACCOUNT_ID</code>, <code>R2_BUCKET</code>, and either (<code>R2_ACCESS_KEY_ID</code> with{' '}
            <code>R2_SECRET_ACCESS_KEY</code>) or a single <code>R2_API_TOKEN</code>.
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
        {isFallbackGallery && (
          <section className="admin-alert admin-alert--warning admin-alert--compact">
            <output aria-live="polite">
              {usedBundledFallback
                ? 'Gallery items below are served from bundled backups because the Cloudflare R2 storage container is currently unreachable. The images may be outdated until connectivity is restored.'
                : 'The Cloudflare R2 storage container is currently unreachable and bundled gallery backups are disabled in this environment. Gallery items will appear again once connectivity is restored.'}
              {fallbackDetail ? ` ${fallbackDetail}` : ''}
              {fallbackReason === 'missing_credentials' && credentialStatus &&
                ` No R2 binding or credentials — accountId: ${credentialStatus.accountId ? 'ok' : 'missing'}, bucket: ${credentialStatus.bucket ? 'ok' : 'missing'}, accessKey: ${credentialStatus.accessKey ? 'ok' : 'missing'}, secret/api-token: ${credentialStatus.secretAccessKey ? 'ok' : 'missing'}.`}
            </output>
          </section>
        )}
        <nav className="admin-category-nav" aria-label="Gallery categories">
          {GALLERY_CATEGORIES.map((cat) => {
            const isActive = cat === category;
            return (
              <a
                key={cat}
                href={`${ADMIN_BASE_PATH}?category=${cat}`}
                className={`admin-category-nav__link ${isActive ? 'is-active' : ''}`}
              >
                {getCategoryLabel(cat)}
              </a>
            );
          })}
        </nav>

        {items.length === 0 ? (
          <p className="admin-empty-state">
            {isFallbackGallery && !usedBundledFallback
              ? 'Gallery items are temporarily unavailable because bundled backups are disabled outside automated tests.'
              : 'No artwork uploaded yet for this category.'}
          </p>
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
