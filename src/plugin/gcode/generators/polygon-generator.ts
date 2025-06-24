import { Point, GcodeSettings } from "../types";
import { MoveCommand, LineCommand } from "../commands";
import { BaseShapeGenerator } from "./base-generator";

export class PolygonGenerator extends BaseShapeGenerator {
  getShapeType(): string {
    return "POLYGON";
  }

  generate(node: SceneNode, globalPos: Point, settings: GcodeSettings): string {
    this.builder.reset();
    this.addShapeComment("POLYGON", node.name);

    const polygonNode = node as PolygonNode;
    const centerX = globalPos.x + node.width / 2;
    const centerY = globalPos.y + node.height / 2;
    const radius = Math.min(node.width, node.height) / 2;
    const sides = polygonNode.pointCount || 3;
    const angleStep = (2 * Math.PI) / sides;

    // Calculate first vertex
    const startX = centerX + radius * Math.cos(-Math.PI / 2);
    const startY = centerY + radius * Math.sin(-Math.PI / 2);
    this.builder.addCommand(
      new MoveCommand({ x: startX, y: startY }, settings.rapidFeedRate)
    );

    // Draw to each vertex
    for (let i = 1; i <= sides; i++) {
      const angle = -Math.PI / 2 + i * angleStep;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      this.builder.addCommand(
        new LineCommand({ x, y }, settings.laserPower, settings.feedRate)
      );
    }

    return this.builder.build();
  }
}
