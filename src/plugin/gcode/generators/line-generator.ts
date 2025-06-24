import { Point, GcodeSettings } from "../types";
import { MoveCommand, LineCommand } from "../commands";
import { BaseShapeGenerator } from "./base-generator";

export class LineGenerator extends BaseShapeGenerator {
  getShapeType(): string {
    return "LINE";
  }

  generate(node: SceneNode, globalPos: Point, settings: GcodeSettings): string {
    this.builder.reset();
    this.addShapeComment("LINE", node.name);

    // Move to start point
    this.builder.addCommand(new MoveCommand(globalPos, settings.rapidFeedRate));

    // Calculate end point based on line direction and length
    const endX = globalPos.x + (node.width || 0);
    const endY = globalPos.y + (node.height || 0);
    this.builder.addCommand(
      new LineCommand(
        { x: endX, y: endY },
        settings.laserPower,
        settings.feedRate
      )
    );

    return this.builder.build();
  }
}
