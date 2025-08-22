// Mock Figma node types for testing
export interface MockRectangleNode {
  type: 'RECTANGLE';
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  absoluteBoundingBox?: { x: number; y: number; width: number; height: number };
  parent?: MockNode;
}

export interface MockEllipseNode {
  type: 'ELLIPSE';
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  absoluteBoundingBox?: { x: number; y: number; width: number; height: number };
  parent?: MockNode;
}

export interface MockPolygonNode {
  type: 'POLYGON';
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pointCount: number;
  absoluteBoundingBox?: { x: number; y: number; width: number; height: number };
  parent?: MockNode;
}

export interface MockStarNode {
  type: 'STAR';
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pointCount: number;
  innerRadius: number;
  absoluteBoundingBox?: { x: number; y: number; width: number; height: number };
  parent?: MockNode;
}

export interface MockLineNode {
  type: 'LINE';
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  absoluteBoundingBox?: { x: number; y: number; width: number; height: number };
  parent?: MockNode;
}

export interface MockVectorNode {
  type: 'VECTOR';
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  vectorNetwork?: {
    segments: Array<{
      start: number;
      end: number;
      tangentStart?: { x: number; y: number };
      tangentEnd?: { x: number; y: number };
    }>;
    vertices: Array<{ x: number; y: number }>;
  };
  vectorPaths?: Array<{
    windingRule: string;
    data: string;
  }>;
  absoluteBoundingBox?: { x: number; y: number; width: number; height: number };
  parent?: MockNode;
}

export type MockNode = MockRectangleNode | MockEllipseNode | MockPolygonNode | MockStarNode | MockLineNode | MockVectorNode;

export const createMockRectangle = (overrides: Partial<MockRectangleNode> = {}): MockRectangleNode => ({
  type: 'RECTANGLE',
  name: 'Test Rectangle',
  x: 0,
  y: 0,
  width: 100,
  height: 50,
  ...overrides
});

export const createMockEllipse = (overrides: Partial<MockEllipseNode> = {}): MockEllipseNode => ({
  type: 'ELLIPSE',
  name: 'Test Ellipse',
  x: 0,
  y: 0,
  width: 100,
  height: 100,
  ...overrides
});

export const createMockPolygon = (overrides: Partial<MockPolygonNode> = {}): MockPolygonNode => ({
  type: 'POLYGON',
  name: 'Test Polygon',
  x: 0,
  y: 0,
  width: 100,
  height: 100,
  pointCount: 6,
  ...overrides
});

export const createMockStar = (overrides: Partial<MockStarNode> = {}): MockStarNode => ({
  type: 'STAR',
  name: 'Test Star',
  x: 0,
  y: 0,
  width: 100,
  height: 100,
  pointCount: 5,
  innerRadius: 0.5,
  ...overrides
});

export const createMockLine = (overrides: Partial<MockLineNode> = {}): MockLineNode => ({
  type: 'LINE',
  name: 'Test Line',
  x: 0,
  y: 0,
  width: 100,
  height: 0,
  ...overrides
});

export const createMockVector = (overrides: Partial<MockVectorNode> = {}): MockVectorNode => ({
  type: 'VECTOR',
  name: 'Test Vector',
  x: 0,
  y: 0,
  width: 100,
  height: 100,
  ...overrides
});