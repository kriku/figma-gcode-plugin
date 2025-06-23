function moveTo(x: number, y: number): string {
  return `G0 X${x.toFixed(3)} Y${y.toFixed(3)}\n`;
}

function lineTo(x: number, y: number): string {
  return `G1 X${x.toFixed(3)} Y${y.toFixed(3)}\n`;
}

function arcTo(
  x: number,
  y: number,
  i: number,
  j: number,
  clockwise: boolean = false
): string {
  const direction = clockwise ? "G2" : "G3";
  return `${direction} X${x.toFixed(3)} Y${y.toFixed(3)} I${i.toFixed(
    3
  )} J${j.toFixed(3)}\n`;
}

function generateCircleGcode(x: number, y: number, radius: number): string {
  let gcode = "";
  // Move to start position (rightmost point of circle)
  gcode += moveTo(x + radius, y);
  // Draw circle using two 180-degree arcs
  gcode += arcTo(x - radius, y, -radius, 0); // First semicircle
  gcode += arcTo(x + radius, y, -radius, 0); // Second semicircle to complete circle
  return gcode;
}

function generateEllipseGcode(
  centerX: number,
  centerY: number,
  radiusX: number,
  radiusY: number,
  segments: number = 32
): string {
  let gcode = "";
  const angleStep = (2 * Math.PI) / segments;

  // Calculate first point
  const startX = centerX + radiusX * Math.cos(0);
  const startY = centerY + radiusY * Math.sin(0);
  gcode += moveTo(startX, startY);

  // Generate ellipse points using parametric equations
  for (let i = 1; i <= segments; i++) {
    const angle = i * angleStep;
    const x = centerX + radiusX * Math.cos(angle);
    const y = centerY + radiusY * Math.sin(angle);
    gcode += lineTo(x, y);
  }

  return gcode;
}

function generatePolygonGcode(node: PolygonNode): string {
  let gcode = "";

  // For regular polygons, calculate vertices
  const centerX = node.x + node.width / 2;
  const centerY = node.y + node.height / 2;
  const radius = Math.min(node.width, node.height) / 2;
  const sides = node.pointCount || 3;
  const angleStep = (2 * Math.PI) / sides;

  // Calculate first vertex
  const startX = centerX + radius * Math.cos(-Math.PI / 2);
  const startY = centerY + radius * Math.sin(-Math.PI / 2);
  gcode += moveTo(startX, startY);

  // Draw to each vertex
  for (let i = 1; i <= sides; i++) {
    const angle = -Math.PI / 2 + i * angleStep;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    gcode += lineTo(x, y);
  }

  return gcode;
}

function generateStarGcode(node: StarNode): string {
  let gcode = "";

  const centerX = node.x + node.width / 2;
  const centerY = node.y + node.height / 2;
  const outerRadius = Math.min(node.width, node.height) / 2;
  const innerRadius = outerRadius * (node.innerRadius || 0.5);
  const points = node.pointCount || 5;
  const angleStep = Math.PI / points;

  // Start at first outer point
  const startX = centerX + outerRadius * Math.cos(-Math.PI / 2);
  const startY = centerY + outerRadius * Math.sin(-Math.PI / 2);
  gcode += moveTo(startX, startY);

  // Alternate between outer and inner points
  for (let i = 1; i <= points * 2; i++) {
    const isOuter = i % 2 === 0;
    const radius = isOuter ? outerRadius : innerRadius;
    const angle = -Math.PI / 2 + i * angleStep;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    gcode += lineTo(x, y);
  }

  return gcode;
}

function generateLineGcode(node: LineNode): string {
  let gcode = "";

  // Move to start point
  gcode += moveTo(node.x, node.y);

  // Calculate end point based on line direction and length
  const endX = node.x + (node.width || 0);
  const endY = node.y + (node.height || 0);
  gcode += lineTo(endX, endY);

  return gcode;
}

function generateVectorGcode(node: VectorNode): string {
  let gcode = "";

  // For vector nodes, we'll approximate with a bounding box for now
  // In a more advanced implementation, you'd parse the vector paths
  gcode += "; VECTOR (approximated as bounding box)\n";
  gcode += moveTo(node.x, node.y);
  gcode += lineTo(node.x + node.width, node.y);
  gcode += lineTo(node.x + node.width, node.y + node.height);
  gcode += lineTo(node.x, node.y + node.height);
  gcode += lineTo(node.x, node.y);

  return gcode;
}

function generateBooleanOperationGcode(node: BooleanOperationNode): string {
  let gcode = "";

  // For boolean operations, we'll approximate with a bounding box
  // In a real implementation, you'd need to resolve the boolean operation
  gcode += `; BOOLEAN_OPERATION (${node.booleanOperation})\n`;
  gcode += moveTo(node.x, node.y);
  gcode += lineTo(node.x + node.width, node.y);
  gcode += lineTo(node.x + node.width, node.y + node.height);
  gcode += lineTo(node.x, node.y + node.height);
  gcode += lineTo(node.x, node.y);

  return gcode;
}

function generateInstanceGcode(node: InstanceNode): string {
  let gcode = "";

  // For component instances, draw the bounding box
  gcode += "; INSTANCE (component instance)\n";
  gcode += moveTo(node.x, node.y);
  gcode += lineTo(node.x + node.width, node.y);
  gcode += lineTo(node.x + node.width, node.y + node.height);
  gcode += lineTo(node.x, node.y + node.height);
  gcode += lineTo(node.x, node.y);

  return gcode;
}

function generateSliceGcode(node: SliceNode): string {
  let gcode = "";

  // For slice nodes, draw the bounding box
  gcode += "; SLICE\n";
  gcode += moveTo(node.x, node.y);
  gcode += lineTo(node.x + node.width, node.y);
  gcode += lineTo(node.x + node.width, node.y + node.height);
  gcode += lineTo(node.x, node.y + node.height);
  gcode += lineTo(node.x, node.y);

  return gcode;
}

function generateCompoundGcode(
  node: FrameNode | GroupNode | SectionNode
): string {
  let gcode = "";

  gcode += `; ${node.type} START - "${node.name}"\n`;

  // Process all children recursively
  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      gcode += generateGcodeForNode(child);
    }
  } else {
    // Fallback to bounding box if no children
    gcode += `; ${node.type} (empty - drawing bounding box)\n`;
    gcode += moveTo(node.x, node.y);
    gcode += lineTo(node.x + node.width, node.y);
    gcode += lineTo(node.x + node.width, node.y + node.height);
    gcode += lineTo(node.x, node.y + node.height);
    gcode += lineTo(node.x, node.y);
  }

  gcode += `; ${node.type} END - "${node.name}"\n`;

  return gcode;
}

export function generateGcodeForNode(node: SceneNode): string {
  let gcode = "";

  if (node.type === "RECTANGLE") {
    gcode += "; RECTANGLE\n";
    gcode += moveTo(node.x, node.y);
    gcode += lineTo(node.x + node.width, node.y);
    gcode += lineTo(node.x + node.width, node.y + node.height);
    gcode += lineTo(node.x, node.y + node.height);
    gcode += lineTo(node.x, node.y);
  } else if (node.type === "ELLIPSE") {
    gcode += "; ELLIPSE\n";
    const centerX = node.x + node.width / 2;
    const centerY = node.y + node.height / 2;
    const radiusX = node.width / 2;
    const radiusY = node.height / 2;

    if (radiusX === radiusY) {
      // Perfect circle - use arc commands
      gcode += generateCircleGcode(centerX, centerY, radiusX);
    } else {
      // Ellipse - use line segments
      gcode += generateEllipseGcode(centerX, centerY, radiusX, radiusY);
    }
  } else if (node.type === "POLYGON") {
    gcode += "; POLYGON\n";
    gcode += generatePolygonGcode(node as PolygonNode);
  } else if (node.type === "STAR") {
    gcode += "; STAR\n";
    gcode += generateStarGcode(node as StarNode);
  } else if (node.type === "LINE") {
    gcode += "; LINE\n";
    gcode += generateLineGcode(node as LineNode);
  } else if (node.type === "VECTOR") {
    gcode += generateVectorGcode(node as VectorNode);
  } else if (node.type === "BOOLEAN_OPERATION") {
    gcode += generateBooleanOperationGcode(node as BooleanOperationNode);
  } else if (node.type === "INSTANCE") {
    gcode += generateInstanceGcode(node as InstanceNode);
  } else if (node.type === "SLICE") {
    gcode += generateSliceGcode(node as SliceNode);
  } else if (node.type === "TEXT") {
    gcode += "; TEXT (bounding box only)\n";
    gcode += moveTo(node.x, node.y);
    gcode += lineTo(node.x + node.width, node.y);
    gcode += lineTo(node.x + node.width, node.y + node.height);
    gcode += lineTo(node.x, node.y + node.height);
    gcode += lineTo(node.x, node.y);
  } else if (
    node.type === "FRAME" ||
    node.type === "GROUP" ||
    node.type === "SECTION"
  ) {
    gcode += generateCompoundGcode(node as FrameNode | GroupNode | SectionNode);
  } else {
    gcode += `; Unsupported node type: ${node.type}\n`;
  }

  return gcode;
}
