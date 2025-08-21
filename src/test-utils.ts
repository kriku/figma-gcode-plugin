/**
 * Test utilities and mocks for Figma SceneNode objects
 */

// Mock SceneNode types for testing
export interface MockSceneNode {
  type: string;
  name?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  absoluteBoundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  parent?: MockSceneNode;
  children?: MockSceneNode[];
}

export function createMockRectangle(
  x: number = 0,
  y: number = 0,
  width: number = 100,
  height: number = 50,
  name: string = "Test Rectangle"
): MockSceneNode {
  return {
    type: "RECTANGLE",
    name,
    x,
    y,
    width,
    height,
    absoluteBoundingBox: { x, y, width, height }
  };
}

export function createMockEllipse(
  x: number = 0,
  y: number = 0,
  width: number = 100,
  height: number = 100,
  name: string = "Test Ellipse"
): MockSceneNode {
  return {
    type: "ELLIPSE",
    name,
    x,
    y,
    width,
    height,
    absoluteBoundingBox: { x, y, width, height }
  };
}

export function createMockLine(
  x: number = 0,
  y: number = 0,
  width: number = 100,
  height: number = 0,
  name: string = "Test Line"
): MockSceneNode {
  return {
    type: "LINE",
    name,
    x,
    y,
    width,
    height,
    absoluteBoundingBox: { x, y, width, height }
  };
}

export function createMockPolygon(
  x: number = 0,
  y: number = 0,
  width: number = 100,
  height: number = 100,
  name: string = "Test Polygon"
): MockSceneNode {
  return {
    type: "POLYGON",
    name,
    x,
    y,
    width,
    height,
    absoluteBoundingBox: { x, y, width, height }
  };
}

export function createMockStar(
  x: number = 0,
  y: number = 0,
  width: number = 100,
  height: number = 100,
  name: string = "Test Star"
): MockSceneNode {
  return {
    type: "STAR",
    name,
    x,
    y,
    width,
    height,
    absoluteBoundingBox: { x, y, width, height }
  };
}

export const DEFAULT_SETTINGS = {
  feedRate: 1000,
  rapidFeedRate: 3000,
  laserPower: 255
};