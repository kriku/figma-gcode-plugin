/**
 * Path Optimization Utilities for G-code Generation
 *
 * This file contains the path optimization algorithms for the Figma to G-code plugin.
 * It has been cleaned up to remove duplicate code that now exists in the refactored
 * modular system under the `gcode/` directory.
 *
 * What remains:
 * - generateOptimizedGcode() - Optimizes path order to minimize laser head travel
 * - generateStandardGcode() - Generates G-code without path optimization
 * - Supporting utility functions for path optimization algorithms
 * - Re-exports from the new modular system for backward compatibility
 *
 * What was removed (now handled by the modular system):
 * - Individual shape generation functions (generateCircleGcode, generatePolygonGcode, etc.)
 * - Basic G-code command functions (moveTo, lineTo, arcTo, etc.)
 * - SVG path parsing functions
 * - Vector processing functions
 * - All duplicate utility functions
 *
 * The modular system under `gcode/` directory now handles all individual shape generation
 * with better separation of concerns, while this file focuses solely on path optimization.
 */

// Import required utilities for the optimization functions
import {
  laserInlineOn,
  laserInlineOff,
  generateGcodeForNode,
  generateFilename,
} from "./gcode";

// Path optimization utilities for minimizing travel distance
interface PathSegment {
  gcode: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  nodeId?: string;
  nodeName?: string;
  parentPath?: string; // Track the path from parent groups
}

interface FlattenedNodeInfo {
  node: SceneNode;
  parentPath: string;
}

// Coordinate transformation utilities
function getGlobalCoordinates(node: SceneNode): { x: number; y: number } {
  // Use absoluteBoundingBox if available for more accurate global positioning
  if ("absoluteBoundingBox" in node && node.absoluteBoundingBox) {
    return {
      x: node.absoluteBoundingBox.x,
      y: node.absoluteBoundingBox.y,
    };
  }

  // Fallback: calculate global coordinates by traversing parent hierarchy
  let globalX = node.x;
  let globalY = node.y;
  let parent = node.parent;

  while (parent && parent.type !== "PAGE") {
    if ("x" in parent && "y" in parent) {
      globalX += parent.x;
      globalY += parent.y;
    }
    parent = parent.parent;
  }

  return { x: globalX, y: globalY };
}

function flattenNodesForOptimization(
  nodes: readonly SceneNode[]
): FlattenedNodeInfo[] {
  const flattenedNodes: FlattenedNodeInfo[] = [];

  function traverseNode(node: SceneNode, parentPath: string = ""): void {
    const currentPath = parentPath
      ? `${parentPath} > ${node.name || "Unnamed"}`
      : node.name || "Unnamed";

    // Check if this is a drawable shape (leaf node)
    if (isDrawableShape(node)) {
      // Store the node and its parent path
      flattenedNodes.push({ node, parentPath: currentPath });
    }
    // If it's a container with children, traverse them
    else if (hasChildren(node) && node.children.length > 0) {
      for (const child of node.children) {
        traverseNode(child, currentPath);
      }
    }
    // If it's a container without children, treat it as a drawable shape (bounding box)
    else if (isContainer(node)) {
      flattenedNodes.push({ node, parentPath: currentPath });
    }
  }

  for (const node of nodes) {
    traverseNode(node);
  }

  return flattenedNodes;
}

function isDrawableShape(node: SceneNode): boolean {
  return [
    "RECTANGLE",
    "ELLIPSE",
    "POLYGON",
    "STAR",
    "LINE",
    "VECTOR",
    "TEXT",
    "BOOLEAN_OPERATION",
    "INSTANCE",
    "SLICE",
  ].includes(node.type);
}

function isContainer(node: SceneNode): boolean {
  return ["FRAME", "GROUP", "SECTION", "COMPONENT", "COMPONENT_SET"].includes(
    node.type
  );
}

function hasChildren(
  node: SceneNode
): node is SceneNode & { children: readonly SceneNode[] } {
  return "children" in node && Array.isArray((node as any).children);
}

function extractPathSegments(
  nodes: readonly SceneNode[],
  laserPower?: number,
  rapidFeedRate?: number,
  feedRate?: number
): PathSegment[] {
  const segments: PathSegment[] = [];

  // First, flatten the node hierarchy to get all drawable shapes
  const flattenedNodeInfos = flattenNodesForOptimization(nodes);

  for (const nodeInfo of flattenedNodeInfos) {
    const { node, parentPath } = nodeInfo;
    const globalPos = getGlobalCoordinates(node);
    const nodeId = node.id;
    const nodeName = node.name;

    // Generate G-code for the node without laser control commands (those are handled by optimization)
    const gcode = generateGcodeForNode(
      node,
      laserPower,
      rapidFeedRate,
      feedRate
    );

    // Calculate start and end positions based on node type for better optimization
    const positions = calculateShapeStartEnd(node, globalPos);

    segments.push({
      gcode,
      startX: positions.startX,
      startY: positions.startY,
      endX: positions.endX,
      endY: positions.endY,
      nodeId,
      nodeName: parentPath, // Use the full parent path for better identification
      parentPath: parentPath,
    });
  }

  return segments;
}

function calculateShapeStartEnd(
  node: SceneNode,
  globalPos: { x: number; y: number }
) {
  let startX = globalPos.x;
  let startY = globalPos.y;
  let endX = globalPos.x;
  let endY = globalPos.y;

  switch (node.type) {
    case "RECTANGLE":
    case "TEXT":
      // Rectangle starts and ends at top-left corner
      startX = globalPos.x;
      startY = globalPos.y;
      endX = globalPos.x;
      endY = globalPos.y;
      break;

    case "ELLIPSE":
      // Circle/ellipse starts and ends at rightmost point
      const centerX = globalPos.x + node.width / 2;
      const centerY = globalPos.y + node.height / 2;
      startX = centerX + node.width / 2;
      startY = centerY;
      endX = startX;
      endY = startY;
      break;

    case "LINE":
      // Line from start to end point
      startX = globalPos.x;
      startY = globalPos.y;
      endX = globalPos.x + (node.width || 0);
      endY = globalPos.y + (node.height || 0);
      break;

    case "POLYGON":
    case "STAR":
      // Regular polygons and stars start at top vertex
      const centerX2 = globalPos.x + node.width / 2;
      const centerY2 = globalPos.y + node.height / 2;
      const radius = Math.min(node.width, node.height) / 2;
      startX = centerX2;
      startY = centerY2 - radius;
      endX = startX;
      endY = startY;
      break;

    case "VECTOR":
      // For vectors, try to find actual path start/end from vectorNetwork
      if ("vectorNetwork" in node && node.vectorNetwork?.vertices) {
        const vertices = Object.values(node.vectorNetwork.vertices);
        if (vertices.length > 0) {
          const firstVertex = vertices[0];
          const lastVertex = vertices[vertices.length - 1];
          startX = globalPos.x + firstVertex.x;
          startY = globalPos.y + firstVertex.y;
          endX = globalPos.x + lastVertex.x;
          endY = globalPos.y + lastVertex.y;
        }
      }
      break;

    default:
      // For other shapes, use bounding box top-left corner
      startX = globalPos.x;
      startY = globalPos.y;
      endX = globalPos.x;
      endY = globalPos.y;
      break;
  }

  return { startX, startY, endX, endY };
}

function calculateDistance(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function findNearestSegment(
  currentX: number,
  currentY: number,
  availableSegments: PathSegment[]
): { index: number; reversed: boolean } {
  let nearestIndex = 0;
  let minDistance = Infinity;
  let shouldReverse = false;

  for (let i = 0; i < availableSegments.length; i++) {
    const segment = availableSegments[i];

    // Check distance to start point
    const distanceToStart = calculateDistance(
      currentX,
      currentY,
      segment.startX,
      segment.startY
    );

    // Check distance to end point (in case we should traverse the segment in reverse)
    const distanceToEnd = calculateDistance(
      currentX,
      currentY,
      segment.endX,
      segment.endY
    );

    if (distanceToStart < minDistance) {
      minDistance = distanceToStart;
      nearestIndex = i;
      shouldReverse = false;
    }

    if (distanceToEnd < minDistance) {
      minDistance = distanceToEnd;
      nearestIndex = i;
      shouldReverse = true;
    }
  }

  return { index: nearestIndex, reversed: shouldReverse };
}

function optimizePathOrder(
  segments: PathSegment[],
  startX: number = 0,
  startY: number = 0
): PathSegment[] {
  if (segments.length === 0) return [];

  const optimizedSegments: PathSegment[] = [];
  const remainingSegments = [...segments];

  let currentX = startX;
  let currentY = startY;

  while (remainingSegments.length > 0) {
    const nearest = findNearestSegment(currentX, currentY, remainingSegments);
    const nearestSegment = remainingSegments.splice(nearest.index, 1)[0];

    // If we should reverse the segment, swap start and end positions
    if (nearest.reversed) {
      const temp = nearestSegment.startX;
      nearestSegment.startX = nearestSegment.endX;
      nearestSegment.endX = temp;

      const tempY = nearestSegment.startY;
      nearestSegment.startY = nearestSegment.endY;
      nearestSegment.endY = tempY;

      // Add a comment to indicate this path is traversed in reverse
      nearestSegment.gcode = `; Path traversed in reverse for optimization\n${nearestSegment.gcode}`;
    }

    optimizedSegments.push(nearestSegment);

    // Update current position to the end of this segment
    currentX = nearestSegment.endX;
    currentY = nearestSegment.endY;
  }

  return optimizedSegments;
}

function addTravelOptimizationComments(
  segments: PathSegment[],
  originalOrder?: PathSegment[]
): string {
  let gcode = "";

  // Calculate total travel distance for optimized order
  let totalTravel = 0;
  let currentX = 0;
  let currentY = 0;

  for (const segment of segments) {
    const travelDistance = calculateDistance(
      currentX,
      currentY,
      segment.startX,
      segment.startY
    );
    totalTravel += travelDistance;
    currentX = segment.endX;
    currentY = segment.endY;
  }

  gcode += `; Optimized total travel distance: ${totalTravel.toFixed(
    2
  )} units\n`;

  // If we have the original order, calculate the savings
  if (originalOrder) {
    let originalTravel = 0;
    currentX = 0;
    currentY = 0;

    for (const segment of originalOrder) {
      const travelDistance = calculateDistance(
        currentX,
        currentY,
        segment.startX,
        segment.startY
      );
      originalTravel += travelDistance;
      currentX = segment.endX;
      currentY = segment.endY;
    }

    const savings = originalTravel - totalTravel;
    const savingsPercent =
      originalOrder.length > 0 ? (savings / originalTravel) * 100 : 0;

    gcode += `; Original travel distance: ${originalTravel.toFixed(2)} units\n`;
    gcode += `; Travel distance saved: ${savings.toFixed(
      2
    )} units (${savingsPercent.toFixed(1)}%)\n`;
  }

  gcode += `; Processing ${segments.length} path segments\n`;
  gcode += ";\n";

  return gcode;
}

export function generateOptimizedGcode(
  nodes: readonly SceneNode[],
  laserPower?: number,
  rapidFeedRate?: number,
  feedRate?: number,
  startPosition?: { x: number; y: number }
): string {
  if (nodes.length === 0) {
    return "; No nodes to process\n";
  }

  // First flatten the hierarchy to see how many drawable shapes we have
  const flattenedNodeInfos = flattenNodesForOptimization(nodes);

  // Extract path segments from nodes (this will also flatten internally)
  const segments = extractPathSegments(
    nodes,
    laserPower,
    rapidFeedRate,
    feedRate
  );

  // Keep original order for comparison
  const originalSegments = [...segments];

  // Optimize the order to minimize travel distance
  const startX = startPosition?.x || 0;
  const startY = startPosition?.y || 0;
  const optimizedSegments = optimizePathOrder(segments, startX, startY);

  // Generate the final G-code
  let gcode = "";

  // Add header comments with hierarchy and optimization statistics
  gcode += "; G-code optimized for minimal laser head travel\n";
  gcode += `; Original selection: ${nodes.length} node(s)\n`;
  gcode += `; Flattened to: ${flattenedNodeInfos.length} drawable shape(s)\n`;
  gcode += addTravelOptimizationComments(optimizedSegments, originalSegments);

  // Add laser initialization
  gcode += laserInlineOn();

  // Process each optimized segment
  for (let i = 0; i < optimizedSegments.length; i++) {
    const segment = optimizedSegments[i];

    gcode += `; --- Path ${i + 1}/${optimizedSegments.length}: ${
      segment.nodeName || "Unnamed"
    } ---\n`;

    // Use the pre-generated G-code for this segment
    gcode += segment.gcode;

    gcode += `; --- End Path ${i + 1} ---\n`;
  }

  // Add laser shutdown
  gcode += laserInlineOff();

  return gcode;
}

export function generateStandardGcode(
  nodes: readonly SceneNode[],
  laserPower?: number,
  rapidFeedRate?: number,
  feedRate?: number
): string {
  if (nodes.length === 0) {
    return "; No nodes to process\n";
  }

  // Flatten the hierarchy to get all drawable shapes
  const flattenedNodeInfos = flattenNodesForOptimization(nodes);

  let gcode = "";

  // Add header
  gcode += "; G-code generated without path optimization\n";
  gcode += `; Original selection: ${nodes.length} node(s)\n`;
  gcode += `; Flattened to: ${flattenedNodeInfos.length} drawable shape(s)\n`;
  gcode += `; Processing shapes in hierarchical order\n`;
  gcode += ";\n";

  // Add laser initialization
  gcode += laserInlineOn();

  // Process each flattened node in original order
  for (let i = 0; i < flattenedNodeInfos.length; i++) {
    const { node, parentPath } = flattenedNodeInfos[i];
    gcode += `; --- Shape ${i + 1}/${
      flattenedNodeInfos.length
    }: ${parentPath} ---\n`;
    gcode += generateGcodeForNode(node, laserPower, rapidFeedRate, feedRate);
    gcode += `; --- End Shape ${i + 1} ---\n`;
  }

  // Add laser shutdown
  gcode += laserInlineOff();

  return gcode;
}

// Re-export functions from the new system for backward compatibility
export {
  generateGcodeForNode,
  generateFilename,
  laserInlineOn,
  laserInlineOff,
};
