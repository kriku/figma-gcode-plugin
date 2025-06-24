import { Point, GcodeSettings } from "../types";
import { BaseShapeGenerator } from "./base-generator";

export class GenericShapeGenerator extends BaseShapeGenerator {
  constructor(builder: any, private shapeTypeName: string) {
    super(builder);
  }

  getShapeType(): string {
    return this.shapeTypeName;
  }

  generate(node: SceneNode, globalPos: Point, settings: GcodeSettings): string {
    this.builder.reset();
    this.addShapeComment(`${this.shapeTypeName} (bounding box)`);

    return (
      this.builder.build() +
      this.createBoundingBox(globalPos, node.width, node.height, settings)
    );
  }
}
