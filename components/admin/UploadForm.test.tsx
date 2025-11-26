import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import UploadForm from './UploadForm';

jest.mock('../../lib/admin-actions', () => ({
  uploadGalleryAction: jest.fn(),
}));

function renderForm(props: { canMutate?: boolean; category: string }) {
  const html = renderToStaticMarkup(<UploadForm {...props} />);
  const container = document.createElement('div');
  container.innerHTML = html;
  return { container, html };
}

describe('UploadForm', () => {
  it('renders upload form fields', () => {
    const { container } = renderForm({ canMutate: true, category: 'flash' });
    const form = container.querySelector('form');
    expect(form).not.toBeNull();
    // Category is now a hidden input (implicit from parent)
    expect(container.querySelector('input[name="category"][type="hidden"]')).not.toBeNull();
    expect(container.querySelector('label[for="file"]')).not.toBeNull();
    expect(container.querySelector('input#file[type="file"]')).not.toBeNull();
    expect(container.querySelector('label[for="alt"]')).not.toBeNull();
    expect(container.querySelector('label[for="caption"]')).not.toBeNull();
    const button = container.querySelector('button[type="submit"]');
    expect(button?.textContent).toBe('Upload');
  });

  it('disables inputs and shows notice when mutations are not allowed', () => {
    const { container } = renderForm({ canMutate: false, category: 'flash' });
    expect(container.textContent).toContain('Uploads are disabled until storage credentials are configured.');
    const fileInput = container.querySelector('input#file');
    expect(fileInput?.getAttribute('disabled')).not.toBeNull();
    const button = container.querySelector('button[type="submit"]');
    expect(button?.getAttribute('disabled')).not.toBeNull();
  });
});
