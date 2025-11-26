import { render, screen } from '@testing-library/react';
import AdminGalleryPage from '../page';

const mockListGalleryImages = jest.fn();
const mockHasR2Credentials = jest.fn();
const mockGetUploadJobSummary = jest.fn();
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
  getUploadJobSummary: (...args: unknown[]) => mockGetUploadJobSummary(...args),
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
    mockGetUploadJobSummary.mockResolvedValue({
      queued: 0,
      scheduled: 0,
      deadLetter: 0,
    });
    // Mock returns for all 5 categories
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

  it('renders all gallery sections with accordion layout', async () => {
    const ui = await AdminGalleryPage();
    const { container } = render(ui);

    // Should have section list container
    expect(container.querySelector('.gallery-section-list')).toBeInTheDocument();

    // Should have all 5 category sections (healed, available, flash, art, hero)
    const sections = container.querySelectorAll('.gallery-section');
    expect(sections.length).toBe(5);

    // Should show category headers (using section buttons)
    const sectionHeaders = container.querySelectorAll('.gallery-section__header');
    expect(sectionHeaders.length).toBe(5);

    // First section should be expanded by default (has content)
    const firstSectionContent = container.querySelector('.gallery-section__content');
    expect(firstSectionContent).toBeInTheDocument();
  });

  it('renders gallery items with compact layout when section is expanded', async () => {
    const ui = await AdminGalleryPage();
    const { container } = render(ui);

    // First section (Healed) is expanded by default
    expect(container.querySelector('.admin-gallery__item--compact')).toBeInTheDocument();

    // Images are now clickable buttons that open a modal
    const previewButton = container.querySelector('.admin-gallery__preview--clickable');
    expect(previewButton).toBeInTheDocument();
    expect(previewButton?.tagName.toLowerCase()).toBe('button');

    // Delete button is now a small X overlay on the image
    const deleteOverlay = container.querySelector('.admin-gallery__delete-x');
    expect(deleteOverlay).toBeInTheDocument();
    const deleteButton = deleteOverlay?.querySelector('button');
    expect(deleteButton).toBeInTheDocument();

    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it('fetches all categories in parallel', async () => {
    await AdminGalleryPage();

    // Should call listGalleryImages for each of the 5 categories
    expect(mockListGalleryImages).toHaveBeenCalledTimes(5);
    expect(mockListGalleryImages).toHaveBeenCalledWith('healed');
    expect(mockListGalleryImages).toHaveBeenCalledWith('available');
    expect(mockListGalleryImages).toHaveBeenCalledWith('flash');
    expect(mockListGalleryImages).toHaveBeenCalledWith('art');
    expect(mockListGalleryImages).toHaveBeenCalledWith('hero');
  });
});
