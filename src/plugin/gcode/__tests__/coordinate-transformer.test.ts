import { CoordinateTransformerImpl } from '../coordinate-transformer';
import { createMockRectangle } from './mock-nodes';

// Extend global with minimal Figma types for testing
declare global {
  interface SceneNode {
    type: string;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    absoluteBoundingBox?: { x: number; y: number; width: number; height: number };
    parent?: SceneNode;
  }
}

describe('CoordinateTransformerImpl', () => {
  let transformer: CoordinateTransformerImpl;

  beforeEach(() => {
    transformer = new CoordinateTransformerImpl();
  });

  describe('getGlobalCoordinates', () => {
    it('should return absoluteBoundingBox coordinates when available', () => {
      const node = createMockRectangle({
        x: 10,
        y: 20,
        absoluteBoundingBox: { x: 50, y: 100, width: 100, height: 50 }
      });

      const result = transformer.getGlobalCoordinates(node as any);

      expect(result).toEqual({ x: 50, y: 100 });
    });

    it('should fallback to node coordinates when absoluteBoundingBox is not available', () => {
      const node = createMockRectangle({
        x: 25,
        y: 75
      });

      const result = transformer.getGlobalCoordinates(node as any);

      expect(result).toEqual({ x: 25, y: 75 });
    });

    it('should calculate global coordinates from parent hierarchy', () => {
      const parentNode = {
        type: 'FRAME',
        x: 100,
        y: 200,
        parent: {
          type: 'PAGE'
        }
      };

      const node = createMockRectangle({
        x: 10,
        y: 20,
        parent: parentNode as any
      });

      const result = transformer.getGlobalCoordinates(node as any);

      expect(result).toEqual({ x: 110, y: 220 });
    });

    it('should handle multiple levels of parent hierarchy', () => {
      const grandParent = {
        type: 'SECTION',
        x: 50,
        y: 60,
        parent: { type: 'PAGE' }
      };

      const parent = {
        type: 'FRAME',
        x: 30,
        y: 40,
        parent: grandParent
      };

      const node = createMockRectangle({
        x: 10,
        y: 20,
        parent: parent as any
      });

      const result = transformer.getGlobalCoordinates(node as any);

      expect(result).toEqual({ x: 90, y: 120 }); // 10 + 30 + 50, 20 + 40 + 60
    });

    it('should stop at PAGE level parent', () => {
      const pageParent = {
        type: 'PAGE',
        x: 1000, // Should not be included
        y: 2000  // Should not be included
      };

      const frameParent = {
        type: 'FRAME',
        x: 100,
        y: 200,
        parent: pageParent
      };

      const node = createMockRectangle({
        x: 10,
        y: 20,
        parent: frameParent as any
      });

      const result = transformer.getGlobalCoordinates(node as any);

      expect(result).toEqual({ x: 110, y: 220 }); // Only node + frame, not page
    });

    it('should handle parents without x,y properties', () => {
      const parentWithoutCoords = {
        type: 'COMPONENT',
        // No x, y properties
        parent: { type: 'PAGE' }
      };

      const node = createMockRectangle({
        x: 15,
        y: 25,
        parent: parentWithoutCoords as any
      });

      const result = transformer.getGlobalCoordinates(node as any);

      expect(result).toEqual({ x: 15, y: 25 });
    });

    it('should handle zero coordinates', () => {
      const node = createMockRectangle({
        x: 0,
        y: 0
      });

      const result = transformer.getGlobalCoordinates(node as any);

      expect(result).toEqual({ x: 0, y: 0 });
    });

    it('should handle negative coordinates', () => {
      const node = createMockRectangle({
        x: -10,
        y: -20,
        absoluteBoundingBox: { x: -50, y: -100, width: 100, height: 50 }
      });

      const result = transformer.getGlobalCoordinates(node as any);

      expect(result).toEqual({ x: -50, y: -100 });
    });

    it('should handle mixed positive and negative coordinates in hierarchy', () => {
      const parent = {
        type: 'FRAME',
        x: -20,
        y: 30,
        parent: { type: 'PAGE' }
      };

      const node = createMockRectangle({
        x: 40,
        y: -10,
        parent: parent as any
      });

      const result = transformer.getGlobalCoordinates(node as any);

      expect(result).toEqual({ x: 20, y: 20 }); // 40 + (-20), -10 + 30
    });

    it('should prefer absoluteBoundingBox over parent hierarchy calculation', () => {
      const parent = {
        type: 'FRAME',
        x: 100,
        y: 200,
        parent: { type: 'PAGE' }
      };

      const node = createMockRectangle({
        x: 10,
        y: 20,
        absoluteBoundingBox: { x: 300, y: 400, width: 100, height: 50 },
        parent: parent as any
      });

      const result = transformer.getGlobalCoordinates(node as any);

      // Should use absoluteBoundingBox, not calculate from hierarchy
      expect(result).toEqual({ x: 300, y: 400 });
    });
  });
});