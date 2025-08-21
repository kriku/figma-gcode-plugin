/**
 * Test setup file for Vitest
 * This file is executed before tests and sets up global mocks
 */

// Mock the Figma global object
const mockFigma = {
  currentPage: {
    name: 'Test Page'
  }
};

// Set the global figma object
(global as any).figma = mockFigma;