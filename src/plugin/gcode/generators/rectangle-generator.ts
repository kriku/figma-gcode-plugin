import { Point, GcodeSettings } from "../types";
import { MoveCommand, LineCommand } from "../commands";
import { BaseShapeGenerator } from "./base-generator";

export class RectangleGenerator extends BaseShapeGenerator {
  getShapeType(): string {
    return "RECTANGLE";
  }

  generate(node: SceneNode, globalPos: Point, settings: GcodeSettings): string {
    this.builder.reset();
    this.addShapeComment("RECTANGLE", node.name);

    return this.builder
      .addCommand(new MoveCommand(globalPos, settings.rapidFeedRate))
      .addCommand(
        new LineCommand(
          { x: globalPos.x + node.width, y: globalPos.y },
          settings.laserPower,
          settings.feedRate
        )
      )
      .addCommand(
        new LineCommand(
          { x: globalPos.x + node.width, y: globalPos.y + node.height },
          settings.laserPower,
          settings.feedRate
        )
      )
      .addCommand(
        new LineCommand(
          { x: globalPos.x, y: globalPos.y + node.height },
          settings.laserPower,
          settings.feedRate
        )
      )
      .addCommand(
        new LineCommand(globalPos, settings.laserPower, settings.feedRate)
      )
      .build();
  }
}
