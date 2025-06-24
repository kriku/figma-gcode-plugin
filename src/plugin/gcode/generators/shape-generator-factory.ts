import { ShapeGenerator, GcodeBuilder } from "../types";
import { GcodeBuilderImpl } from "../builder";
import { RectangleGenerator } from "./rectangle-generator";
import { EllipseGenerator } from "./ellipse-generator";
import { PolygonGenerator } from "./polygon-generator";
import { StarGenerator } from "./star-generator";
import { LineGenerator } from "./line-generator";
import { VectorGenerator } from "./vector-generator";
import { GenericShapeGenerator } from "./generic-shape-generator";
import { CompoundShapeGenerator } from "./compound-shape-generator";

export class ShapeGeneratorFactory {
  private static builders = new Map<string, GcodeBuilder>();
  private static nodeProcessor:
    | ((node: SceneNode, settings: any) => string)
    | null = null;

  static setNodeProcessor(
    processor: (node: SceneNode, settings: any) => string
  ): void {
    this.nodeProcessor = processor;
  }

  static createGenerator(nodeType: string): ShapeGenerator {
    const builder = this.getBuilder(nodeType);

    switch (nodeType) {
      case "RECTANGLE":
        return new RectangleGenerator(builder);
      case "ELLIPSE":
        return new EllipseGenerator(builder);
      case "POLYGON":
        return new PolygonGenerator(builder);
      case "STAR":
        return new StarGenerator(builder);
      case "LINE":
        return new LineGenerator(builder);
      case "VECTOR":
        return new VectorGenerator(builder);
      case "FRAME":
      case "GROUP":
      case "SECTION":
        if (!this.nodeProcessor) {
          throw new Error(
            "Node processor must be set before creating compound generators"
          );
        }
        return new CompoundShapeGenerator(builder, this.nodeProcessor);
      case "BOOLEAN_OPERATION":
        return new GenericShapeGenerator(builder, "BOOLEAN_OPERATION");
      case "INSTANCE":
        return new GenericShapeGenerator(builder, "INSTANCE");
      case "SLICE":
        return new GenericShapeGenerator(builder, "SLICE");
      case "TEXT":
        return new GenericShapeGenerator(builder, "TEXT");
      default:
        return new GenericShapeGenerator(builder, `UNSUPPORTED_${nodeType}`);
    }
  }

  private static getBuilder(nodeType: string): GcodeBuilder {
    if (!this.builders.has(nodeType)) {
      this.builders.set(nodeType, new GcodeBuilderImpl());
    }
    return this.builders.get(nodeType)!;
  }

  static clearBuilders(): void {
    this.builders.clear();
  }
}
