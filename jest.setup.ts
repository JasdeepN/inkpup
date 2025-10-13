import '@testing-library/jest-dom';
// Mock next/image globally for all tests (Next.js 16/React 19/Jest 30)
import React from 'react';
jest.mock('next/image', () => ({
	__esModule: true,
	default: (props) => {
		return React.createElement('img', props);
	},
}));
