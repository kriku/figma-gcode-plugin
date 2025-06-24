// Main exports for the refactored G-code generation system
export { GcodeGenerator } from "./gcode-generator";
export { ShapeGeneratorFactory } from "./generators/shape-generator-factory";
export * from "./types";
export * from "./commands";

import { GcodeGenerator } from "./gcode-generator";
import { LaserControlCommand } from "./commands";

// Export as named functions for backward compatibility
export function generateGcodeForNode(
  node: SceneNode,
  laserPower?: number,
  rapidFeedRate?: number,
  feedRate?: number
): string {
  const generator = new GcodeGenerator();
  return generator.generateGcode(
    [node],
    feedRate || 1000,
    rapidFeedRate || 3000,
    laserPower || 255
  );
}

export function generateFilename(nodes: readonly SceneNode[]): string {
  const generator = new GcodeGenerator();
  return generator.generateFilename(nodes);
}

export function laserInlineOn(): string {
  const cmd = new LaserControlCommand(true, true);
  return cmd.execute();
}

export function laserInlineOff(): string {
  const cmd = new LaserControlCommand(false, true);
  return cmd.execute();
}
