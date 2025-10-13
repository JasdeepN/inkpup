import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { ADMIN_INTERNAL_PATH, isAdminHost } from './lib/admin-hosts';
import { isGalleryCategory } from './lib/gallery-types';

const ADMIN_PATH_PREFIX = `${ADMIN_INTERNAL_PATH}/`;

function shouldBypass(pathname: string): boolean {
  return (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/manifest.json' ||
    pathname.startsWith('/favicon-') ||
    pathname.startsWith('/icon-') ||
    pathname.startsWith('/apple-touch-icon') ||
    pathname.startsWith('/assets')
  );
}

export function proxy(request: NextRequest) {
  const host = request.headers.get('host');
  if (!isAdminHost(host)) {
    return NextResponse.next();
  }

  const { nextUrl } = request;
  const { pathname } = nextUrl;

  // If the admin portal lives at the root ("/"), there's nothing to rewrite.
  // Only rewrite when ADMIN_INTERNAL_PATH is a non-root path.
  if ((ADMIN_INTERNAL_PATH as string) !== '/') {
    if (
      shouldBypass(pathname) ||
      pathname === ADMIN_INTERNAL_PATH ||
      pathname.startsWith(ADMIN_PATH_PREFIX)
    ) {
      return NextResponse.next();
    }

    const rewriteUrl = nextUrl.clone();

    // Map direct category path like "/available" to the admin portal with a category query param.
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 1 && isGalleryCategory(segments[0])) {
      rewriteUrl.pathname = ADMIN_INTERNAL_PATH;
      rewriteUrl.searchParams.set('category', segments[0]);
      return NextResponse.rewrite(rewriteUrl);
    }

    rewriteUrl.pathname = ADMIN_INTERNAL_PATH;
    return NextResponse.rewrite(rewriteUrl);
  }

  return NextResponse.next();
}