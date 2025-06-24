import { Point, GcodeSettings } from "../types";
import { MoveCommand, LineCommand } from "../commands";
import { BaseShapeGenerator } from "./base-generator";

export class StarGenerator extends BaseShapeGenerator {
  getShapeType(): string {
    return "STAR";
  }

  generate(node: SceneNode, globalPos: Point, settings: GcodeSettings): string {
    this.builder.reset();
    this.addShapeComment("STAR", node.name);

    const starNode = node as StarNode;
    const centerX = globalPos.x + node.width / 2;
    const centerY = globalPos.y + node.height / 2;
    const outerRadius = Math.min(node.width, node.height) / 2;
    const innerRadius = outerRadius * (starNode.innerRadius || 0.5);
    const points = starNode.pointCount || 5;
    const angleStep = Math.PI / points;

    // Start at first outer point
    const startX = centerX + outerRadius * Math.cos(-Math.PI / 2);
    const startY = centerY + outerRadius * Math.sin(-Math.PI / 2);
    this.builder.addCommand(
      new MoveCommand({ x: startX, y: startY }, settings.rapidFeedRate)
    );

    // Alternate between outer and inner points
    for (let i = 1; i <= points * 2; i++) {
      const isOuter = i % 2 === 0;
      const radius = isOuter ? outerRadius : innerRadius;
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
