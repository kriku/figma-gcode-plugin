import { Point, GcodeSettings } from "../types";
import { BaseShapeGenerator } from "./base-generator";
import { VectorPathProcessor } from "../vector-processing/vector-path-processor";

export class VectorGenerator extends BaseShapeGenerator {
  private pathProcessor: VectorPathProcessor;

  constructor(builder: any) {
    super(builder);
    this.pathProcessor = new VectorPathProcessor(builder);
  }

  getShapeType(): string {
    return "VECTOR";
  }

  generate(node: SceneNode, globalPos: Point, settings: GcodeSettings): string {
    this.builder.reset();
    this.addShapeComment("VECTOR", node.name);

    const vectorNode = node as VectorNode;

    // Process vector networks (paths)
    if (
      vectorNode.vectorNetwork &&
      vectorNode.vectorNetwork.segments.length > 0
    ) {
      return (
        this.builder.addComment("Vector Network Processing").build() +
        this.pathProcessor.processVectorNetwork(
          vectorNode.vectorNetwork,
          globalPos,
          settings
        )
      );
    } else if (vectorNode.vectorPaths && vectorNode.vectorPaths.length > 0) {
      // Fallback to vectorPaths if vectorNetwork is not available
      return (
        this.builder.addComment("Vector Paths Processing").build() +
        this.pathProcessor.processVectorPaths(
          [...vectorNode.vectorPaths],
          globalPos,
          settings
        )
      );
    } else {
      // Final fallback to bounding box if no vector data available
      this.builder.addComment("VECTOR (no path data - using bounding box)");
      return (
        this.builder.build() +
        this.createBoundingBox(globalPos, node.width, node.height, settings)
      );
    }
  }
}
