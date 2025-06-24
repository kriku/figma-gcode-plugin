import { ShapeGenerator, Point, GcodeSettings, GcodeBuilder } from "../types";
import { MoveCommand, LineCommand } from "../commands";

export abstract class BaseShapeGenerator implements ShapeGenerator {
  protected builder: GcodeBuilder;

  constructor(builder: GcodeBuilder) {
    this.builder = builder;
  }

  abstract generate(
    node: SceneNode,
    globalPos: Point,
    settings: GcodeSettings
  ): string;
  abstract getShapeType(): string;

  protected createBoundingBox(
    globalPos: Point,
    width: number,
    height: number,
    settings: GcodeSettings
  ): string {
    this.builder.reset();

    return this.builder
      .addCommand(new MoveCommand(globalPos, settings.rapidFeedRate))
      .addCommand(
        new LineCommand(
          { x: globalPos.x + width, y: globalPos.y },
          settings.laserPower,
          settings.feedRate
        )
      )
      .addCommand(
        new LineCommand(
          { x: globalPos.x + width, y: globalPos.y + height },
          settings.laserPower,
          settings.feedRate
        )
      )
      .addCommand(
        new LineCommand(
          { x: globalPos.x, y: globalPos.y + height },
          settings.laserPower,
          settings.feedRate
        )
      )
      .addCommand(
        new LineCommand(globalPos, settings.laserPower, settings.feedRate)
      )
      .build();
  }

  protected addShapeComment(shapeName: string, nodeName?: string): void {
    const comment = nodeName ? `${shapeName} - "${nodeName}"` : shapeName;
    this.builder.addComment(comment);
  }
}
