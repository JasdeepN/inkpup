import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Uploads - Redirecting',
};

/**
 * Uploads page has been consolidated into the Gallery page.
 * This redirect ensures old bookmarks and links continue to work.
 */
export default function UploadsRedirectPage() {
  redirect('/gallery');
}
