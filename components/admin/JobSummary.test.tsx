import React from 'react';
import { render, screen } from '@testing-library/react';
import JobSummary from './JobSummary';

describe('JobSummary', () => {
  it('renders job counts and times', () => {
    const summary = {
      queued: 2,
      scheduled: 1,
      deadLetter: 0,
      nextReadyAt: Date.now() + 10000,
      oldestQueuedAt: Date.now() - 10000,
    };
    render(<JobSummary jobSummary={summary} />);
    expect(screen.getAllByText(/Queued:/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Scheduled retries:/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Dead-lettered:/i)[0]).toBeInTheDocument();
  });
});