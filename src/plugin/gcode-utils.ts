function moveTo(x: number, y: number): string {
  return `G0 X${x.toFixed(3)} Y${y.toFixed(3)}\n`;
}

function lineTo(x: number, y: number): string {
  return `G1 X${x.toFixed(3)} Y${y.toFixed(3)}\n`;
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
  } else {
    gcode += `; Unsupported node type: ${node.type}\n`;
  }

  return gcode;
}
