import { render, screen } from '@testing-library/react';
import AdminGalleryPage from '../page';

const mockListGalleryImages = jest.fn();
const mockHasR2Credentials = jest.fn();
const mockIsAdminHost = jest.fn();
const mockVerifySessionToken = jest.fn();
const mockGetSessionCookieOptions = jest.fn();
const mockIsAdminEnabled = jest.fn();
const mockHeaders = jest.fn();
const mockCookies = jest.fn();
const mockRedirect = jest.fn();

jest.mock('../../../lib/r2-server', () => ({
  listGalleryImages: (...args: unknown[]) => mockListGalleryImages(...args),
  hasR2Credentials: (...args: unknown[]) => mockHasR2Credentials(...args),
  deleteGalleryImage: jest.fn(),
}));

jest.mock('../../../lib/admin-hosts', () => ({
  isAdminHost: (...args: unknown[]) => mockIsAdminHost(...args),
}));

jest.mock('../../../lib/admin-auth', () => ({
  verifySessionToken: (...args: unknown[]) => mockVerifySessionToken(...args),
  getSessionCookieOptions: (...args: unknown[]) => mockGetSessionCookieOptions(...args),
  isAdminEnabled: (...args: unknown[]) => mockIsAdminEnabled(...args),
}));

jest.mock('next/headers', () => ({
  headers: (...args: unknown[]) => mockHeaders(...args),
  cookies: (...args: unknown[]) => mockCookies(...args),
}));

jest.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => mockRedirect(...args),
}));

describe('AdminGalleryPage', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    mockIsAdminEnabled.mockReturnValue(true);
    mockHeaders.mockResolvedValue({
      get: (header: string) => (header === 'host' ? 'admin.example.com' : null),
    });
    mockIsAdminHost.mockReturnValue(true);
    mockCookies.mockResolvedValue({
      get: () => undefined,
    });
    mockGetSessionCookieOptions.mockReturnValue({ name: 'admin-session' });
    mockVerifySessionToken.mockReturnValue(false);
    mockHasR2Credentials.mockReturnValue(true);
    mockListGalleryImages.mockReturnValue({
      asPromise: () =>
        Promise.resolve({
          items: [
            {
              id: 'img-1',
              src: '/healed/example.webp',
              alt: 'Tattoo example',
              caption: 'A healed tattoo example',
              size: 91341,
              lastModified: '2025-10-12T19:55:52.000Z',
              key: 'healed/example.webp',
            },
          ],
        }),
    });
  });

  it('renders gallery items with tight layout and full-width icon-only actions', async () => {
    const ui = await AdminGalleryPage({ searchParams: Promise.resolve({}) });
    const { container } = render(ui);

    expect(container.querySelector('.admin-gallery__item--tight')).toBeInTheDocument();

    const viewLink = screen.getByRole('link', { name: /view/i });
    expect(viewLink).toHaveClass('btn--primary', 'admin-gallery__action');
    expect(viewLink.textContent?.trim()).toBe('');

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    expect(deleteButton).toHaveClass('btn--danger', 'admin-gallery__action');
    expect(deleteButton.textContent?.trim()).toBe('');

    const addToHeroButton = screen.getByRole('button', { name: /add to hero/i });
    expect(addToHeroButton).toHaveClass('btn--secondary', 'admin-gallery__action');
    expect(addToHeroButton.textContent?.trim()).toBe('');

    expect(mockRedirect).not.toHaveBeenCalled();
  });
});
