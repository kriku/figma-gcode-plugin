// Core types and interfaces for G-code generation

export interface GcodeCommand {
  execute(): string;
}

export interface Point {
  x: number;
  y: number;
}

export interface GcodeSettings {
  feedRate: number;
  rapidFeedRate: number;
  laserPower: number;
}

export interface ShapeGenerator {
  generate(node: SceneNode, globalPos: Point, settings: GcodeSettings): string;
  getShapeType(): string;
}

export interface GcodeBuilder {
  addCommand(command: GcodeCommand): GcodeBuilder;
  addComment(comment: string): GcodeBuilder;
  build(): string;
  reset(): GcodeBuilder;
}

export interface CoordinateTransformer {
  getGlobalCoordinates(node: SceneNode): Point;
}
