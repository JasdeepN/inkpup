import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import GallerySection from './GallerySection';
import type { GalleryCategory } from '@/lib/gallery-types';

// Mock the DeleteButton component
jest.mock('../../app/gallery/DeleteButton', () => ({
  __esModule: true,
  default: ({ imageKey }: { imageKey: string }) => (
    <button data-testid={`delete-${imageKey}`}>Delete</button>
  ),
}));

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} data-testid="gallery-image" />
  ),
}));

const mockJobSummary = {
  queued: 0,
  scheduled: 0,
  deadLetter: 0,
};

const mockImages = [
  { id: 'img1', src: '/test1.jpg', alt: 'Test 1', key: 'healed/test1.jpg' },
  { id: 'img2', src: '/test2.jpg', alt: 'Test 2', key: 'healed/test2.jpg' },
  { id: 'img3', src: '/test3.jpg', alt: 'Test 3', key: 'healed/test3.jpg' },
];

describe('GallerySection', () => {
  const defaultProps = {
    category: 'healed' as GalleryCategory,
    images: mockImages,
    jobSummary: mockJobSummary,
    canMutate: true,
    isExpanded: false,
    onToggle: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders category label and image count in header', () => {
    render(<GallerySection {...defaultProps} />);
    
    // Header should show category and count
    expect(screen.getByRole('button', { name: /healed/i })).toBeInTheDocument();
    expect(screen.getByText(/3 images/i)).toBeInTheDocument(); // image count
  });

  it('shows collapsed state when isExpanded is false', () => {
    render(<GallerySection {...defaultProps} isExpanded={false} />);
    
    // Use aria-controls to target the main section header, not upload panel
    const button = screen.getByRole('button', { name: /healed/i });
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('shows expanded state when isExpanded is true', () => {
    render(<GallerySection {...defaultProps} isExpanded={true} />);
    
    // Use aria-controls to target the main section header (gallery-section-*), not upload panel
    const buttons = screen.getAllByRole('button', { name: /healed/i });
    const mainHeaderButton = buttons.find(btn => btn.getAttribute('aria-controls')?.startsWith('gallery-section-'));
    expect(mainHeaderButton).toHaveAttribute('aria-expanded', 'true');
  });

  it('calls onToggle when header is clicked', () => {
    const onToggle = jest.fn();
    render(<GallerySection {...defaultProps} onToggle={onToggle} />);
    
    fireEvent.click(screen.getByRole('button', { name: /healed/i }));
    expect(onToggle).toHaveBeenCalledWith('healed');
  });

  it('renders images when expanded', () => {
    render(<GallerySection {...defaultProps} isExpanded={true} />);
    
    const images = screen.getAllByTestId('gallery-image');
    expect(images).toHaveLength(3);
  });

  it('shows empty message when no images', () => {
    render(<GallerySection {...defaultProps} images={[]} isExpanded={true} />);
    
    expect(screen.getByText(/no artwork uploaded yet/i)).toBeInTheDocument();
  });

  it('shows zero count badge when empty', () => {
    render(<GallerySection {...defaultProps} images={[]} />);
    
    expect(screen.getByText(/0 images/i)).toBeInTheDocument();
  });

  it('renders delete buttons when canMutate is true', () => {
    render(<GallerySection {...defaultProps} isExpanded={true} canMutate={true} />);
    
    // Each image should have a delete button
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    expect(deleteButtons.length).toBeGreaterThan(0);
  });

  it('uses correct category label for display', () => {
    render(<GallerySection {...defaultProps} category="flash" />);
    
    // 'flash' should show as 'Flash' in the header
    expect(screen.getByRole('button', { name: /flash/i })).toBeInTheDocument();
  });
});
