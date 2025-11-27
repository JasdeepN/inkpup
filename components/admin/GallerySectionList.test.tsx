import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import GallerySectionList from './GallerySectionList';
import type { GalleryCategory } from '@/lib/gallery-types';

// Mock GallerySection to simplify testing
jest.mock('./GallerySection', () => ({
  __esModule: true,
  default: ({ 
    category, 
    images, 
    isExpanded, 
    onToggle 
  }: { 
    category: string; 
    images: any[]; 
    isExpanded: boolean; 
    onToggle: (category: string) => void 
  }) => (
    <div data-testid={`section-${category}`}>
      <button 
        onClick={() => onToggle(category)}
        data-testid={`toggle-${category}`}
        aria-expanded={isExpanded}
      >
        {category} ({images.length})
      </button>
      {isExpanded && <div data-testid={`content-${category}`}>Content</div>}
    </div>
  ),
}));

const mockJobSummary = {
  queued: 0,
  scheduled: 0,
  deadLetter: 0,
};

const mockCategories = [
  { category: 'healed' as GalleryCategory, images: { items: [{ id: '1' }, { id: '2' }] } },
  { category: 'available' as GalleryCategory, images: { items: [{ id: '3' }] } },
  { category: 'flash' as GalleryCategory, images: { items: [] } },
];

describe('GallerySectionList', () => {
  const defaultProps = {
    categories: mockCategories,
    jobSummary: mockJobSummary,
    canMutate: true,
  };

  it('renders all category sections', () => {
    render(<GallerySectionList {...defaultProps} />);
    
    expect(screen.getByTestId('section-healed')).toBeInTheDocument();
    expect(screen.getByTestId('section-available')).toBeInTheDocument();
    expect(screen.getByTestId('section-flash')).toBeInTheDocument();
  });

  it('expands first category by default', () => {
    render(<GallerySectionList {...defaultProps} />);
    
    // First category (healed) should be expanded
    expect(screen.getByTestId('toggle-healed')).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('content-healed')).toBeInTheDocument();
  });

  it('other categories are collapsed by default', () => {
    render(<GallerySectionList {...defaultProps} />);
    
    expect(screen.getByTestId('toggle-available')).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByTestId('toggle-flash')).toHaveAttribute('aria-expanded', 'false');
  });

  it('toggles section expansion when clicked', () => {
    render(<GallerySectionList {...defaultProps} />);
    
    // Click to expand 'available'
    fireEvent.click(screen.getByTestId('toggle-available'));
    expect(screen.getByTestId('toggle-available')).toHaveAttribute('aria-expanded', 'true');
    
    // Click again to collapse
    fireEvent.click(screen.getByTestId('toggle-available'));
    expect(screen.getByTestId('toggle-available')).toHaveAttribute('aria-expanded', 'false');
  });

  it('allows multiple sections to be expanded', () => {
    render(<GallerySectionList {...defaultProps} />);
    
    // First is already expanded, expand second
    fireEvent.click(screen.getByTestId('toggle-available'));
    
    expect(screen.getByTestId('toggle-healed')).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('toggle-available')).toHaveAttribute('aria-expanded', 'true');
  });

  it('displays correct image counts', () => {
    render(<GallerySectionList {...defaultProps} />);
    
    expect(screen.getByText(/healed.*2/i)).toBeInTheDocument();
    expect(screen.getByText(/available.*1/i)).toBeInTheDocument();
    expect(screen.getByText(/flash.*0/i)).toBeInTheDocument();
  });
});
