import { Point, GcodeSettings } from "../types";
import { BaseShapeGenerator } from "./base-generator";

export class CompoundShapeGenerator extends BaseShapeGenerator {
  constructor(
    builder: any,
    private nodeProcessor: (node: SceneNode, settings: GcodeSettings) => string
  ) {
    super(builder);
  }

  getShapeType(): string {
    return "COMPOUND";
  }

  generate(node: SceneNode, globalPos: Point, settings: GcodeSettings): string {
    this.builder.reset();

    const compoundNode = node as FrameNode | GroupNode | SectionNode;
    this.addShapeComment(`${compoundNode.type} START`, compoundNode.name);

    let result = this.builder.build();

    // Process all children recursively
    if (compoundNode.children && compoundNode.children.length > 0) {
      for (const child of compoundNode.children) {
        result += this.nodeProcessor(child, settings);
      }
    } else {
      // Fallback to bounding box if no children
      this.builder.reset();
      this.addShapeComment(
        `${compoundNode.type} (empty - drawing bounding box)`
      );
      result +=
        this.builder.build() +
        this.createBoundingBox(globalPos, node.width, node.height, settings);
    }

    this.builder.reset();
    this.addShapeComment(`${compoundNode.type} END`, compoundNode.name);
    result += this.builder.build();

    return result;
  }
}
