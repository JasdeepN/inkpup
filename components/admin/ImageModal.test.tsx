/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent } from '@testing-library/react';
import ImageModal from './ImageModal';

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt }: { src: string; alt: string }) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} data-testid="modal-image" />;
  };
});

describe('ImageModal', () => {
  const mockOnClose = jest.fn();
  const defaultProps = {
    src: '/test-image.jpg',
    alt: 'Test Image',
    onClose: mockOnClose,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset body overflow
    document.body.style.overflow = '';
  });

  it('renders modal with image', () => {
    render(<ImageModal {...defaultProps} />);

    const image = screen.getByTestId('modal-image');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/test-image.jpg');
    expect(image).toHaveAttribute('alt', 'Test Image');
  });

  it('renders as a dialog', () => {
    render(<ImageModal {...defaultProps} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-label', 'Test Image');
  });

  it('renders close button with label', () => {
    render(<ImageModal {...defaultProps} />);

    const closeBtn = screen.getByRole('button', { name: /close modal/i });
    expect(closeBtn).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(<ImageModal {...defaultProps} />);

    const closeBtn = screen.getByRole('button', { name: /close modal/i });
    fireEvent.click(closeBtn);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', () => {
    render(<ImageModal {...defaultProps} />);

    const dialog = screen.getByRole('dialog');
    fireEvent.click(dialog);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('does not close when image area is clicked', () => {
    render(<ImageModal {...defaultProps} />);

    const image = screen.getByTestId('modal-image');
    fireEvent.click(image);

    // Click on image should not trigger backdrop close
    // (the click event doesn't propagate to backdrop when clicking content)
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('calls onClose when Escape key is pressed', () => {
    render(<ImageModal {...defaultProps} />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('does not close on other key presses', () => {
    render(<ImageModal {...defaultProps} />);

    fireEvent.keyDown(document, { key: 'Enter' });
    fireEvent.keyDown(document, { key: 'a' });

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('prevents body scroll when mounted', () => {
    render(<ImageModal {...defaultProps} />);

    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restores body scroll when unmounted', () => {
    const { unmount } = render(<ImageModal {...defaultProps} />);

    expect(document.body.style.overflow).toBe('hidden');

    unmount();

    expect(document.body.style.overflow).toBe('');
  });

  it('cleans up event listener on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

    const { unmount } = render(<ImageModal {...defaultProps} />);
    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

    removeEventListenerSpy.mockRestore();
  });
});
