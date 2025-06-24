import { Point, GcodeSettings } from "../types";
import { MoveCommand, LineCommand, ArcCommand } from "../commands";
import { BaseShapeGenerator } from "./base-generator";

export class EllipseGenerator extends BaseShapeGenerator {
  getShapeType(): string {
    return "ELLIPSE";
  }

  generate(node: SceneNode, globalPos: Point, settings: GcodeSettings): string {
    this.builder.reset();
    this.addShapeComment("ELLIPSE", node.name);

    const centerX = globalPos.x + node.width / 2;
    const centerY = globalPos.y + node.height / 2;
    const radiusX = node.width / 2;
    const radiusY = node.height / 2;

    if (radiusX === radiusY) {
      // Perfect circle - use arc commands
      return this.builder
        .addCommand(
          new MoveCommand(
            { x: centerX + radiusX, y: centerY },
            settings.rapidFeedRate
          )
        )
        .addCommand(
          new ArcCommand(
            { x: centerX + radiusX, y: centerY },
            { x: -radiusX, y: 0 },
            false,
            settings.laserPower,
            settings.feedRate
          )
        )
        .build();
    } else {
      // Ellipse - use line segments
      return this.generateEllipseSegments(
        centerX,
        centerY,
        radiusX,
        radiusY,
        settings
      );
    }
  }

  private generateEllipseSegments(
    centerX: number,
    centerY: number,
    radiusX: number,
    radiusY: number,
    settings: GcodeSettings,
    segments: number = 32
  ): string {
    const angleStep = (2 * Math.PI) / segments;

    // Calculate first point
    const startX = centerX + radiusX * Math.cos(0);
    const startY = centerY + radiusY * Math.sin(0);
    this.builder.addCommand(
      new MoveCommand({ x: startX, y: startY }, settings.rapidFeedRate)
    );

    // Generate ellipse points using parametric equations
    for (let i = 1; i <= segments; i++) {
      const angle = i * angleStep;
      const x = centerX + radiusX * Math.cos(angle);
      const y = centerY + radiusY * Math.sin(angle);
      this.builder.addCommand(
        new LineCommand({ x, y }, settings.laserPower, settings.feedRate)
      );
    }

    return this.builder.build();
  }
}
