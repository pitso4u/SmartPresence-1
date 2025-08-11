import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Global cleanup after each test
// This ensures that each test runs in isolation
afterEach(() => {
  cleanup();
});

// Mock the window.URL.createObjectURL method which is used in the export functionality
window.URL.createObjectURL = vi.fn(() => 'mocked-url');

// Mock the document.createRange method used by some UI libraries
// This is a simple mock that returns an object with the required methods
document.createRange = () => ({
  setStart: vi.fn(),
  setEnd: vi.fn(),
  // @ts-ignore - This is a mock, so we can ignore the type error for the parent element
  commonAncestorContainer: {
    nodeName: 'BODY',
    ownerDocument: document,
  },
});
