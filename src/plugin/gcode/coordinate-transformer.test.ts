import { describe, it, expect } from 'vitest';
import { CoordinateTransformerImpl } from './coordinate-transformer';
import { MockSceneNode } from '../../test-utils';

describe('CoordinateTransformer', () => {
  let transformer: CoordinateTransformerImpl;

  beforeEach(() => {
    transformer = new CoordinateTransformerImpl();
  });

  describe('getGlobalCoordinates', () => {
    it('should return absoluteBoundingBox coordinates when available', () => {
      const node: MockSceneNode = {
        type: 'RECTANGLE',
        x: 10,
        y: 20,
        width: 50,
        height: 30,
        absoluteBoundingBox: {
          x: 100,
          y: 200,
          width: 50,
          height: 30
        }
      };

      const result = transformer.getGlobalCoordinates(node as any as SceneNode);

      expect(result).toEqual({ x: 100, y: 200 });
    });

    it('should calculate coordinates from node position when absoluteBoundingBox is not available', () => {
      const node: MockSceneNode = {
        type: 'RECTANGLE',
        x: 15,
        y: 25,
        width: 40,
        height: 60
      };

      const result = transformer.getGlobalCoordinates(node as any as SceneNode);

      expect(result).toEqual({ x: 15, y: 25 });
    });

    it('should traverse parent hierarchy to calculate global coordinates', () => {
      const pageNode: MockSceneNode = {
        type: 'PAGE',
        x: 0,
        y: 0,
        width: 1000,
        height: 1000
      };

      const frameNode: MockSceneNode = {
        type: 'FRAME',
        x: 50,
        y: 100,
        width: 200,
        height: 150,
        parent: pageNode
      };

      const groupNode: MockSceneNode = {
        type: 'GROUP',
        x: 20,
        y: 30,
        width: 100,
        height: 75,
        parent: frameNode
      };

      const rectangleNode: MockSceneNode = {
        type: 'RECTANGLE',
        x: 10,
        y: 15,
        width: 50,
        height: 25,
        parent: groupNode
      };

      // Set up parent references
      frameNode.parent = pageNode;
      groupNode.parent = frameNode;
      rectangleNode.parent = groupNode;

      const result = transformer.getGlobalCoordinates(rectangleNode as any as SceneNode);

      // Expected: 50 (frame) + 20 (group) + 10 (rectangle) = 80
      // Expected: 100 (frame) + 30 (group) + 15 (rectangle) = 145
      expect(result).toEqual({ x: 80, y: 145 });
    });

    it('should handle nodes with no parents', () => {
      const node: MockSceneNode = {
        type: 'RECTANGLE',
        x: 35,
        y: 45,
        width: 80,
        height: 90
      };

      const result = transformer.getGlobalCoordinates(node as any as SceneNode);

      expect(result).toEqual({ x: 35, y: 45 });
    });

    it('should stop traversing at PAGE node', () => {
      const pageNode: MockSceneNode = {
        type: 'PAGE',
        x: 1000, // This should not be included in calculation
        y: 2000,
        width: 5000,
        height: 5000
      };

      const frameNode: MockSceneNode = {
        type: 'FRAME',
        x: 10,
        y: 20,
        width: 100,
        height: 100,
        parent: pageNode
      };

      const result = transformer.getGlobalCoordinates(frameNode as any as SceneNode);

      // Should only include frame coordinates, not page coordinates
      expect(result).toEqual({ x: 10, y: 20 });
    });

    it('should handle parents without x,y properties', () => {
      const parentWithoutCoords = {
        type: 'COMPONENT',
        // No x, y properties
        width: 200,
        height: 200
      };

      const childNode: MockSceneNode = {
        type: 'RECTANGLE',
        x: 25,
        y: 35,
        width: 50,
        height: 40,
        parent: parentWithoutCoords as any
      };

      const result = transformer.getGlobalCoordinates(childNode as any as SceneNode);

      // Should only use child coordinates when parent has no x,y
      expect(result).toEqual({ x: 25, y: 35 });
    });

    it('should handle zero coordinates correctly', () => {
      const frameNode: MockSceneNode = {
        type: 'FRAME',
        x: 0,
        y: 0,
        width: 100,
        height: 100
      };

      const childNode: MockSceneNode = {
        type: 'RECTANGLE',
        x: 0,
        y: 0,
        width: 50,
        height: 50,
        parent: frameNode
      };

      const result = transformer.getGlobalCoordinates(childNode as any as SceneNode);

      expect(result).toEqual({ x: 0, y: 0 });
    });
  });
});