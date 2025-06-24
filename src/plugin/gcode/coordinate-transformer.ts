import { CoordinateTransformer, Point } from "./types";

export class CoordinateTransformerImpl implements CoordinateTransformer {
  getGlobalCoordinates(node: SceneNode): Point {
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
}
