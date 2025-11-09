import React from 'react';
import { render } from '@testing-library/react';
import TrendSparkline from './TrendSparkline';

describe('TrendSparkline', () => {
  test('returns null when fewer than two points provided', () => {
    const { container } = render(<TrendSparkline values={[10]} />);
    expect(container.firstChild).toBeNull();
  });

  test('renders svg sparkline when values are provided', () => {
    const { container } = render(<TrendSparkline values={[10, 12, 9, 16]} />);
    const svg = container.querySelector('svg.admin-sparkline');
    expect(svg).toBeTruthy();
    const path = svg?.querySelector('path');
    expect(path).toBeTruthy();
  });
});
