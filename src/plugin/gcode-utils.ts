// Laser control commands for inline mode
function laserInlineOn(): string {
  return "M3 I ; Enable laser inline mode\n";
}

function laserInlineOff(): string {
  return "M5 I ; Disable laser inline mode\n";
}

function moveTo(x: number, y: number, rapidFeedRate?: number): string {
  // G0 is rapid positioning (laser off), always set S0 for safety
  const feedParam = rapidFeedRate ? ` F${rapidFeedRate}` : "";
  return `G0 X${x.toFixed(3)} Y${y.toFixed(3)}${feedParam} S0\n`;
}

function lineTo(
  x: number,
  y: number,
  laserPower?: number,
  feedRate?: number
): string {
  // G1 is linear interpolation (laser on), include S parameter for laser power and F for feed rate
  const sParam = laserPower !== undefined ? ` S${laserPower}` : "";
  const feedParam = feedRate ? ` F${feedRate}` : "";
  return `G1 X${x.toFixed(3)} Y${y.toFixed(3)}${feedParam}${sParam}\n`;
}

function arcTo(
  x: number,
  y: number,
  i: number,
  j: number,
  clockwise: boolean = false,
  laserPower?: number,
  feedRate?: number
): string {
  const direction = clockwise ? "G2" : "G3";
  const sParam = laserPower !== undefined ? ` S${laserPower}` : "";
  const feedParam = feedRate ? ` F${feedRate}` : "";
  return `${direction} X${x.toFixed(3)} Y${y.toFixed(3)} I${i.toFixed(
    3
  )} J${j.toFixed(3)}${feedParam}${sParam}\n`;
}

function generateCircleGcode(
  x: number,
  y: number,
  radius: number,
  laserPower?: number,
  rapidFeedRate?: number,
  feedRate?: number
): string {
  let gcode = "";
  // Move to start position (rightmost point of circle)
  gcode += moveTo(x + radius, y, rapidFeedRate);
  // Draw circle
  gcode += arcTo(x + radius, y, -radius, 0, false, laserPower, feedRate); // Second semicircle to complete circle
  return gcode;
}

function generateEllipseGcode(
  centerX: number,
  centerY: number,
  radiusX: number,
  radiusY: number,
  segments: number = 32,
  laserPower?: number,
  rapidFeedRate?: number,
  feedRate?: number
): string {
  let gcode = "";
  const angleStep = (2 * Math.PI) / segments;

  // Calculate first point
  const startX = centerX + radiusX * Math.cos(0);
  const startY = centerY + radiusY * Math.sin(0);
  gcode += moveTo(startX, startY, rapidFeedRate);

  // Generate ellipse points using parametric equations
  for (let i = 1; i <= segments; i++) {
    const angle = i * angleStep;
    const x = centerX + radiusX * Math.cos(angle);
    const y = centerY + radiusY * Math.sin(angle);
    gcode += lineTo(x, y, laserPower, feedRate);
  }

  return gcode;
}

function generatePolygonGcode(
  node: PolygonNode,
  globalPos?: { x: number; y: number },
  laserPower?: number,
  rapidFeedRate?: number,
  feedRate?: number
): string {
  let gcode = "";

  // Use global position if provided, otherwise use node's local position
  const nodeX = globalPos ? globalPos.x : node.x;
  const nodeY = globalPos ? globalPos.y : node.y;

  // For regular polygons, calculate vertices
  const centerX = nodeX + node.width / 2;
  const centerY = nodeY + node.height / 2;
  const radius = Math.min(node.width, node.height) / 2;
  const sides = node.pointCount || 3;
  const angleStep = (2 * Math.PI) / sides;

  // Calculate first vertex
  const startX = centerX + radius * Math.cos(-Math.PI / 2);
  const startY = centerY + radius * Math.sin(-Math.PI / 2);
  gcode += moveTo(startX, startY, rapidFeedRate);

  // Draw to each vertex
  for (let i = 1; i <= sides; i++) {
    const angle = -Math.PI / 2 + i * angleStep;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    gcode += lineTo(x, y, laserPower, feedRate);
  }

  return gcode;
}

function generateStarGcode(
  node: StarNode,
  globalPos?: { x: number; y: number },
  laserPower?: number,
  rapidFeedRate?: number,
  feedRate?: number
): string {
  let gcode = "";

  // Use global position if provided, otherwise use node's local position
  const nodeX = globalPos ? globalPos.x : node.x;
  const nodeY = globalPos ? globalPos.y : node.y;

  const centerX = nodeX + node.width / 2;
  const centerY = nodeY + node.height / 2;
  const outerRadius = Math.min(node.width, node.height) / 2;
  const innerRadius = outerRadius * (node.innerRadius || 0.5);
  const points = node.pointCount || 5;
  const angleStep = Math.PI / points;

  // Start at first outer point
  const startX = centerX + outerRadius * Math.cos(-Math.PI / 2);
  const startY = centerY + outerRadius * Math.sin(-Math.PI / 2);
  gcode += moveTo(startX, startY, rapidFeedRate);

  // Alternate between outer and inner points
  for (let i = 1; i <= points * 2; i++) {
    const isOuter = i % 2 === 0;
    const radius = isOuter ? outerRadius : innerRadius;
    const angle = -Math.PI / 2 + i * angleStep;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    gcode += lineTo(x, y, laserPower, feedRate);
  }

  return gcode;
}

function generateLineGcode(
  node: LineNode,
  globalPos?: { x: number; y: number },
  laserPower?: number,
  rapidFeedRate?: number,
  feedRate?: number
): string {
  let gcode = "";

  // Use global position if provided, otherwise use node's local position
  const nodeX = globalPos ? globalPos.x : node.x;
  const nodeY = globalPos ? globalPos.y : node.y;

  // Move to start point
  gcode += moveTo(nodeX, nodeY, rapidFeedRate);

  // Calculate end point based on line direction and length
  const endX = nodeX + (node.width || 0);
  const endY = nodeY + (node.height || 0);
  gcode += lineTo(endX, endY, laserPower, feedRate);

  return gcode;
}

function generateVectorGcode(
  node: VectorNode,
  globalPos?: { x: number; y: number },
  laserPower?: number,
  rapidFeedRate?: number,
  feedRate?: number
): string {
  let gcode = "";

  // Use global position if provided, otherwise use node's local position
  const offsetX = globalPos ? globalPos.x : node.x;
  const offsetY = globalPos ? globalPos.y : node.y;

  gcode += "; VECTOR\n";

  // Process vector networks (paths)
  if (node.vectorNetwork && node.vectorNetwork.segments.length > 0) {
    gcode += parseVectorNetwork(
      node.vectorNetwork,
      offsetX,
      offsetY,
      laserPower,
      rapidFeedRate,
      feedRate
    );
  } else if (node.vectorPaths && node.vectorPaths.length > 0) {
    // Fallback to vectorPaths if vectorNetwork is not available
    gcode += parseVectorPaths(
      [...node.vectorPaths],
      offsetX,
      offsetY,
      laserPower,
      rapidFeedRate,
      feedRate
    );
  } else {
    // Final fallback to bounding box if no vector data available
    gcode += "; VECTOR (no path data - using bounding box)\n";
    gcode += moveTo(offsetX, offsetY, rapidFeedRate);
    gcode += lineTo(offsetX + node.width, offsetY, laserPower, feedRate);
    gcode += lineTo(
      offsetX + node.width,
      offsetY + node.height,
      laserPower,
      feedRate
    );
    gcode += lineTo(offsetX, offsetY + node.height, laserPower, feedRate);
    gcode += lineTo(offsetX, offsetY, laserPower, feedRate);
  }

  return gcode;
}

function parseVectorNetwork(
  vectorNetwork: VectorNetwork,
  offsetX: number,
  offsetY: number,
  laserPower?: number,
  rapidFeedRate?: number,
  feedRate?: number
): string {
  let gcode = "";

  const { vertices, segments } = vectorNetwork;

  // Group segments by their connectivity to form paths
  const paths = groupSegmentsIntoPaths([...segments]);

  for (const path of paths) {
    let isFirstPoint = true;

    for (const segmentIndex of path) {
      const segment = segments[segmentIndex];
      const startVertex = vertices[segment.start];
      const endVertex = vertices[segment.end];

      // Convert relative coordinates to absolute
      const startX = offsetX + startVertex.x;
      const startY = offsetY + startVertex.y;
      const endX = offsetX + endVertex.x;
      const endY = offsetY + endVertex.y;

      if (isFirstPoint) {
        gcode += moveTo(startX, startY, rapidFeedRate);
        isFirstPoint = false;
      }

      if (
        segment.tangentStart?.x ||
        segment.tangentStart?.y ||
        segment.tangentEnd?.x ||
        segment.tangentEnd?.y
      ) {
        // Handle curved segments (Bezier curves)
        gcode += generateBezierGcode(
          startX,
          startY,
          endX,
          endY,
          segment.tangentStart,
          segment.tangentEnd,
          offsetX,
          offsetY,
          laserPower,
          feedRate
        );
      } else {
        // Straight line segment
        gcode += lineTo(endX, endY, laserPower, feedRate);
      }
    }
  }

  return gcode;
}

function parseVectorPaths(
  vectorPaths: VectorPath[],
  offsetX: number,
  offsetY: number,
  laserPower?: number,
  rapidFeedRate?: number,
  feedRate?: number
): string {
  let gcode = "";

  for (const path of vectorPaths) {
    if (path.data) {
      gcode += parseSVGPath(
        path.data,
        offsetX,
        offsetY,
        laserPower,
        rapidFeedRate,
        feedRate
      );
    }
  }

  return gcode;
}

function parseSVGPath(
  pathData: string,
  offsetX: number,
  offsetY: number,
  laserPower?: number,
  rapidFeedRate?: number,
  feedRate?: number
): string {
  let gcode = "";

  // Simple SVG path parser - handles basic commands
  const commands =
    pathData.match(/[MmLlHhVvCcSsQqTtAaZz][^MmLlHhVvCcSsQqTtAaZz]*/g) || [];

  let currentX = 0;
  let currentY = 0;
  let startX = 0;
  let startY = 0;

  for (const command of commands) {
    const type = command[0];
    const params = command
      .slice(1)
      .trim()
      .split(/[\s,]+/)
      .map(Number)
      .filter((n) => !isNaN(n));

    switch (type.toLowerCase()) {
      case "m": // Move to
        if (params.length >= 2) {
          if (type === "M") {
            // Absolute move
            currentX = params[0];
            currentY = params[1];
          } else {
            // Relative move
            currentX += params[0];
            currentY += params[1];
          }
          startX = currentX;
          startY = currentY;
          gcode += moveTo(
            offsetX + currentX,
            offsetY + currentY,
            rapidFeedRate
          );
        }
        break;

      case "l": // Line to
        for (let i = 0; i < params.length; i += 2) {
          if (i + 1 < params.length) {
            if (type === "L") {
              // Absolute line
              currentX = params[i];
              currentY = params[i + 1];
            } else {
              // Relative line
              currentX += params[i];
              currentY += params[i + 1];
            }
            gcode += lineTo(
              offsetX + currentX,
              offsetY + currentY,
              laserPower,
              feedRate
            );
          }
        }
        break;

      case "h": // Horizontal line
        if (params.length >= 1) {
          if (type === "H") {
            currentX = params[0];
          } else {
            currentX += params[0];
          }
          gcode += lineTo(
            offsetX + currentX,
            offsetY + currentY,
            laserPower,
            feedRate
          );
        }
        break;

      case "v": // Vertical line
        if (params.length >= 1) {
          if (type === "V") {
            currentY = params[0];
          } else {
            currentY += params[0];
          }
          gcode += lineTo(
            offsetX + currentX,
            offsetY + currentY,
            laserPower,
            feedRate
          );
        }
        break;

      case "c": // Cubic Bezier curve
        for (let i = 0; i < params.length; i += 6) {
          if (i + 5 < params.length) {
            const cp1x = type === "C" ? params[i] : currentX + params[i];
            const cp1y =
              type === "C" ? params[i + 1] : currentY + params[i + 1];
            const cp2x =
              type === "C" ? params[i + 2] : currentX + params[i + 2];
            const cp2y =
              type === "C" ? params[i + 3] : currentY + params[i + 3];
            const endX =
              type === "C" ? params[i + 4] : currentX + params[i + 4];
            const endY =
              type === "C" ? params[i + 5] : currentY + params[i + 5];

            // Approximate Bezier curve with line segments
            gcode += approximateBezierCurve(
              offsetX + currentX,
              offsetY + currentY,
              offsetX + cp1x,
              offsetY + cp1y,
              offsetX + cp2x,
              offsetY + cp2y,
              offsetX + endX,
              offsetY + endY,
              laserPower,
              feedRate
            );

            currentX = endX;
            currentY = endY;
          }
        }
        break;

      case "z": // Close path
        gcode += lineTo(
          offsetX + startX,
          offsetY + startY,
          laserPower,
          feedRate
        );
        currentX = startX;
        currentY = startY;
        break;
    }
  }

  return gcode;
}

function generateBezierGcode(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  tangentStart: VectorVertex | undefined,
  tangentEnd: VectorVertex | undefined,
  offsetX: number,
  offsetY: number,
  laserPower?: number,
  feedRate?: number
): string {
  if (!tangentStart && !tangentEnd) {
    // No tangents, just a straight line
    return lineTo(endX, endY, laserPower, feedRate);
  }

  // Convert tangent points to control points
  const cp1x = tangentStart ? startX + tangentStart.x : startX;
  const cp1y = tangentStart ? startY + tangentStart.y : startY;
  const cp2x = tangentEnd ? endX + tangentEnd.x : endX;
  const cp2y = tangentEnd ? endY + tangentEnd.y : endY;

  return approximateBezierCurve(
    startX,
    startY,
    cp1x,
    cp1y,
    cp2x,
    cp2y,
    endX,
    endY,
    laserPower,
    feedRate
  );
}

function approximateBezierCurve(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
  laserPower?: number,
  feedRate?: number,
  segments: number = 16
): string {
  let gcode = "";

  for (let i = 1; i <= segments; i++) {
    const t = i / segments;
    const oneMinusT = 1 - t;

    // Cubic Bezier formula
    const x =
      oneMinusT ** 3 * x0 +
      3 * oneMinusT ** 2 * t * x1 +
      3 * oneMinusT * t ** 2 * x2 +
      t ** 3 * x3;

    const y =
      oneMinusT ** 3 * y0 +
      3 * oneMinusT ** 2 * t * y1 +
      3 * oneMinusT * t ** 2 * y2 +
      t ** 3 * y3;

    gcode += lineTo(x, y, laserPower, feedRate);
  }

  return gcode;
}

function groupSegmentsIntoPaths(segments: VectorSegment[]): number[][] {
  const paths: number[][] = [];
  const used = new Set<number>();

  for (let i = 0; i < segments.length; i++) {
    if (used.has(i)) continue;

    const path: number[] = [i];
    used.add(i);

    // Try to find connected segments
    let currentEnd = segments[i].end;
    let foundConnection = true;

    while (foundConnection) {
      foundConnection = false;
      for (let j = 0; j < segments.length; j++) {
        if (used.has(j)) continue;

        if (segments[j].start === currentEnd) {
          path.push(j);
          used.add(j);
          currentEnd = segments[j].end;
          foundConnection = true;
          break;
        }
      }
    }

    paths.push(path);
  }

  return paths;
}

function generateBooleanOperationGcode(
  node: BooleanOperationNode,
  globalPos?: { x: number; y: number },
  laserPower?: number,
  rapidFeedRate?: number,
  feedRate?: number
): string {
  let gcode = "";

  // Use global position if provided, otherwise use node's local position
  const nodeX = globalPos ? globalPos.x : node.x;
  const nodeY = globalPos ? globalPos.y : node.y;

  // For boolean operations, we'll approximate with a bounding box
  // In a real implementation, you'd need to resolve the boolean operation
  gcode += `; BOOLEAN_OPERATION (${node.booleanOperation})\n`;
  gcode += moveTo(nodeX, nodeY, rapidFeedRate);
  gcode += lineTo(nodeX + node.width, nodeY, laserPower, feedRate);
  gcode += lineTo(
    nodeX + node.width,
    nodeY + node.height,
    laserPower,
    feedRate
  );
  gcode += lineTo(nodeX, nodeY + node.height, laserPower, feedRate);
  gcode += lineTo(nodeX, nodeY, laserPower, feedRate);

  return gcode;
}

function generateInstanceGcode(
  node: InstanceNode,
  globalPos?: { x: number; y: number },
  laserPower?: number,
  rapidFeedRate?: number,
  feedRate?: number
): string {
  let gcode = "";

  // Use global position if provided, otherwise use node's local position
  const nodeX = globalPos ? globalPos.x : node.x;
  const nodeY = globalPos ? globalPos.y : node.y;

  // For component instances, draw the bounding box
  gcode += "; INSTANCE (component instance)\n";
  gcode += moveTo(nodeX, nodeY, rapidFeedRate);
  gcode += lineTo(nodeX + node.width, nodeY, laserPower, feedRate);
  gcode += lineTo(
    nodeX + node.width,
    nodeY + node.height,
    laserPower,
    feedRate
  );
  gcode += lineTo(nodeX, nodeY + node.height, laserPower, feedRate);
  gcode += lineTo(nodeX, nodeY, laserPower, feedRate);

  return gcode;
}

function generateSliceGcode(
  node: SliceNode,
  globalPos?: { x: number; y: number },
  laserPower?: number,
  rapidFeedRate?: number,
  feedRate?: number
): string {
  let gcode = "";

  // Use global position if provided, otherwise use node's local position
  const nodeX = globalPos ? globalPos.x : node.x;
  const nodeY = globalPos ? globalPos.y : node.y;

  // For slice nodes, draw the bounding box
  gcode += "; SLICE\n";
  gcode += moveTo(nodeX, nodeY, rapidFeedRate);
  gcode += lineTo(nodeX + node.width, nodeY, laserPower, feedRate);
  gcode += lineTo(
    nodeX + node.width,
    nodeY + node.height,
    laserPower,
    feedRate
  );
  gcode += lineTo(nodeX, nodeY + node.height, laserPower, feedRate);
  gcode += lineTo(nodeX, nodeY, laserPower, feedRate);

  return gcode;
}

function generateCompoundGcode(
  node: FrameNode | GroupNode | SectionNode,
  laserPower?: number,
  rapidFeedRate?: number,
  feedRate?: number
): string {
  let gcode = "";

  gcode += `; ${node.type} START - "${node.name}"\n`;

  // Process all children recursively
  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      gcode += generateGcodeForNode(child, laserPower, rapidFeedRate, feedRate);
    }
  } else {
    // Fallback to bounding box if no children - use global coordinates
    const globalPos = getGlobalCoordinates(node);
    gcode += `; ${node.type} (empty - drawing bounding box)\n`;
    gcode += moveTo(globalPos.x, globalPos.y, rapidFeedRate);
    gcode += lineTo(
      globalPos.x + node.width,
      globalPos.y,
      laserPower,
      feedRate
    );
    gcode += lineTo(
      globalPos.x + node.width,
      globalPos.y + node.height,
      laserPower,
      feedRate
    );
    gcode += lineTo(
      globalPos.x,
      globalPos.y + node.height,
      laserPower,
      feedRate
    );
    gcode += lineTo(globalPos.x, globalPos.y, laserPower, feedRate);
  }

  gcode += `; ${node.type} END - "${node.name}"\n`;

  return gcode;
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

export function generateGcodeForNode(
  node: SceneNode,
  laserPower?: number,
  rapidFeedRate?: number,
  feedRate?: number
): string {
  console.log("Generating G-code for vector node:", node);

  let gcode = "";

  // Get global coordinates for the node (transforms local frame coordinates to global canvas coordinates)
  const globalPos = getGlobalCoordinates(node);

  if (node.type === "RECTANGLE") {
    gcode += "; RECTANGLE\n";
    gcode += moveTo(globalPos.x, globalPos.y, rapidFeedRate);
    gcode += lineTo(
      globalPos.x + node.width,
      globalPos.y,
      laserPower,
      feedRate
    );
    gcode += lineTo(
      globalPos.x + node.width,
      globalPos.y + node.height,
      laserPower,
      feedRate
    );
    gcode += lineTo(
      globalPos.x,
      globalPos.y + node.height,
      laserPower,
      feedRate
    );
    gcode += lineTo(globalPos.x, globalPos.y, laserPower, feedRate);
  } else if (node.type === "ELLIPSE") {
    gcode += "; ELLIPSE\n";
    const centerX = globalPos.x + node.width / 2;
    const centerY = globalPos.y + node.height / 2;
    const radiusX = node.width / 2;
    const radiusY = node.height / 2;

    if (radiusX === radiusY) {
      // Perfect circle - use arc commands
      gcode += generateCircleGcode(
        centerX,
        centerY,
        radiusX,
        laserPower,
        rapidFeedRate,
        feedRate
      );
    } else {
      // Ellipse - use line segments
      gcode += generateEllipseGcode(
        centerX,
        centerY,
        radiusX,
        radiusY,
        32,
        laserPower,
        rapidFeedRate,
        feedRate
      );
    }
  } else if (node.type === "POLYGON") {
    gcode += "; POLYGON\n";
    gcode += generatePolygonGcode(
      node as PolygonNode,
      globalPos,
      laserPower,
      rapidFeedRate,
      feedRate
    );
  } else if (node.type === "STAR") {
    gcode += "; STAR\n";
    gcode += generateStarGcode(
      node as StarNode,
      globalPos,
      laserPower,
      rapidFeedRate,
      feedRate
    );
  } else if (node.type === "LINE") {
    gcode += "; LINE\n";
    gcode += generateLineGcode(
      node as LineNode,
      globalPos,
      laserPower,
      rapidFeedRate,
      feedRate
    );
  } else if (node.type === "VECTOR") {
    gcode += generateVectorGcode(
      node as VectorNode,
      globalPos,
      laserPower,
      rapidFeedRate,
      feedRate
    );
  } else if (node.type === "BOOLEAN_OPERATION") {
    gcode += generateBooleanOperationGcode(
      node as BooleanOperationNode,
      globalPos,
      laserPower,
      rapidFeedRate,
      feedRate
    );
  } else if (node.type === "INSTANCE") {
    gcode += generateInstanceGcode(
      node as InstanceNode,
      globalPos,
      laserPower,
      rapidFeedRate,
      feedRate
    );
  } else if (node.type === "SLICE") {
    gcode += generateSliceGcode(
      node as SliceNode,
      globalPos,
      laserPower,
      rapidFeedRate,
      feedRate
    );
  } else if (node.type === "TEXT") {
    gcode += "; TEXT (bounding box only)\n";
    gcode += moveTo(globalPos.x, globalPos.y, rapidFeedRate);
    gcode += lineTo(
      globalPos.x + node.width,
      globalPos.y,
      laserPower,
      feedRate
    );
    gcode += lineTo(
      globalPos.x + node.width,
      globalPos.y + node.height,
      laserPower,
      feedRate
    );
    gcode += lineTo(
      globalPos.x,
      globalPos.y + node.height,
      laserPower,
      feedRate
    );
    gcode += lineTo(globalPos.x, globalPos.y, laserPower, feedRate);
  } else if (
    node.type === "FRAME" ||
    node.type === "GROUP" ||
    node.type === "SECTION"
  ) {
    gcode += generateCompoundGcode(
      node as FrameNode | GroupNode | SectionNode,
      laserPower,
      rapidFeedRate,
      feedRate
    );
  } else {
    gcode += `; Unsupported node type: ${node.type}\n`;
  }

  return gcode;
}

export function generateFilename(nodes: readonly SceneNode[]): string {
  if (nodes.length === 0) {
    return "gcode";
  }

  // Use the first node's name as base filename
  let baseName = nodes[0].name || "untitled";

  // Clean the name for use as filename (remove invalid characters)
  baseName = baseName.replace(/[<>:"/\\|?*]/g, "_");

  // Add count if multiple nodes
  if (nodes.length > 1) {
    baseName += `_and_${nodes.length - 1}_more`;
  }

  // Add timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);

  return `${baseName}_${timestamp}`;
}

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

// Export laser control functions
export { laserInlineOn, laserInlineOff };
