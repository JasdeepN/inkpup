/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent } from '@testing-library/react';
import GalleryUploadPanel from './GalleryUploadPanel';

// Mock UploadForm component
jest.mock('./UploadForm', () => {
  return function MockUploadForm({ canMutate, category }: { canMutate: boolean; category: string }) {
    return (
      <div data-testid="upload-form">
        Upload form for {category} (canMutate: {canMutate.toString()})
      </div>
    );
  };
});

const defaultProps = {
  category: 'flash' as const,
  jobSummary: {
    queued: 0,
    scheduled: 0,
    deadLetter: 0,
  },
  canMutate: true,
};

describe('GalleryUploadPanel', () => {
  it('renders collapsed by default', () => {
    render(<GalleryUploadPanel {...defaultProps} />);

    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByTestId('upload-form')).not.toBeInTheDocument();
  });

  it('displays category label in header', () => {
    render(<GalleryUploadPanel {...defaultProps} />);

    expect(screen.getByText(/upload to flash/i)).toBeInTheDocument();
  });

  it('expands when header is clicked', () => {
    render(<GalleryUploadPanel {...defaultProps} />);

    const header = screen.getByRole('button');
    fireEvent.click(header);

    expect(header).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('upload-form')).toBeInTheDocument();
  });

  it('collapses when header is clicked again', () => {
    render(<GalleryUploadPanel {...defaultProps} />);

    const header = screen.getByRole('button');
    
    // Expand
    fireEvent.click(header);
    expect(screen.getByTestId('upload-form')).toBeInTheDocument();

    // Collapse
    fireEvent.click(header);
    expect(screen.queryByTestId('upload-form')).not.toBeInTheDocument();
  });

  it('passes correct props to UploadForm', () => {
    render(<GalleryUploadPanel {...defaultProps} />);

    const header = screen.getByRole('button');
    fireEvent.click(header);

    expect(screen.getByText(/upload form for flash/i)).toBeInTheDocument();
    expect(screen.getByText(/canmutate: true/i)).toBeInTheDocument();
  });

  it('displays different category labels', () => {
    const { rerender } = render(<GalleryUploadPanel {...defaultProps} category="healed" />);
    expect(screen.getByText(/upload to healed/i)).toBeInTheDocument();

    rerender(<GalleryUploadPanel {...defaultProps} category="available" />);
    expect(screen.getByText(/upload to available/i)).toBeInTheDocument();

    rerender(<GalleryUploadPanel {...defaultProps} category="art" />);
    expect(screen.getByText(/upload to art/i)).toBeInTheDocument();
  });

  it('handles canMutate=false', () => {
    render(<GalleryUploadPanel {...defaultProps} canMutate={false} />);

    const header = screen.getByRole('button');
    fireEvent.click(header);

    expect(screen.getByText(/canmutate: false/i)).toBeInTheDocument();
  });
});
