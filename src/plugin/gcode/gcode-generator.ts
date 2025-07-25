import { Point, GcodeSettings, CoordinateTransformer } from "./types";
import { CoordinateTransformerImpl } from "./coordinate-transformer";
import { ShapeGeneratorFactory } from "./generators/shape-generator-factory";
import {
  CommentCommand,
  SetupCommand,
  LaserControlCommand,
  EndProgramCommand,
} from "./commands";
import { GcodeBuilderImpl } from "./builder";
import { generateOptimizedGcode, generateStandardGcode } from "../gcode-utils";

export class GcodeGenerator {
  private coordinateTransformer: CoordinateTransformer;
  private mainBuilder: GcodeBuilderImpl;
  private optimizeTravel: boolean = false;

  constructor(optimizeTravel: boolean = false) {
    this.coordinateTransformer = new CoordinateTransformerImpl();
    this.mainBuilder = new GcodeBuilderImpl();
    this.optimizeTravel = optimizeTravel;

    // Set the node processor for compound shapes
    ShapeGeneratorFactory.setNodeProcessor(
      (node: SceneNode, settings: GcodeSettings) =>
        this.generateForNode(node, settings)
    );
  }

  generateGcode(
    nodes: readonly SceneNode[],
    feedRate: number = 1000,
    rapidFeedRate: number = 3000,
    laserPower: number = 255,
    optimizeTravel?: boolean,
    startPosition?: { x: number; y: number }
  ): string {
    // Validate inputs
    if (!nodes || nodes.length === 0) {
      throw new Error("No nodes provided for G-code generation.");
    }

    if (feedRate <= 0 || rapidFeedRate <= 0 || laserPower < 0) {
      throw new Error(
        "Invalid parameters: feed rates must be positive and laser power must be non-negative."
      );
    }

    // Use path optimization if requested or if set in constructor
    const shouldOptimize = optimizeTravel ?? this.optimizeTravel;

    if (shouldOptimize) {
      return generateOptimizedGcode(
        nodes,
        laserPower,
        rapidFeedRate,
        feedRate,
        startPosition
      );
    } else {
      return generateStandardGcode(nodes, laserPower, rapidFeedRate, feedRate);
    }
  }

  // Keep the old implementation for compatibility when called directly
  generateGcodeClassic(
    nodes: readonly SceneNode[],
    feedRate: number = 1000,
    rapidFeedRate: number = 3000,
    laserPower: number = 255
  ): string {
    // Validate inputs
    if (!nodes || nodes.length === 0) {
      throw new Error("No nodes provided for G-code generation.");
    }

    if (feedRate <= 0 || rapidFeedRate <= 0 || laserPower < 0) {
      throw new Error(
        "Invalid parameters: feed rates must be positive and laser power must be non-negative."
      );
    }

    const settings: GcodeSettings = { feedRate, rapidFeedRate, laserPower };

    this.mainBuilder.reset();

    // Add header comments and setup
    this.addHeader(nodes, settings);

    let processedNodes = 0;

    // Process each selected node
    for (const node of nodes) {
      try {
        const gcode = this.generateForNode(node, settings);
        if (gcode && gcode.trim().length > 0) {
          this.mainBuilder
            .addComment("")
            .addComment(
              `Processing node: ${node.name || "Unnamed"} (${node.type})`
            );
          // Add the generated gcode directly since it's already built
          this.mainBuilder.addCommand({ execute: () => gcode });
          processedNodes++;
        } else {
          this.mainBuilder
            .addComment("")
            .addComment(
              `Skipped node: ${node.name || "Unnamed"} (${
                node.type
              }) - no geometry generated`
            );
        }
      } catch (error) {
        console.warn(
          `Failed to process node ${node.name || "Unnamed"} (${node.type}):`,
          error
        );
        this.mainBuilder
          .addComment("")
          .addComment(
            `Error processing node: ${node.name || "Unnamed"} (${node.type})`
          );
      }
    }

    if (processedNodes === 0) {
      throw new Error(
        "No valid geometry was generated from the selected objects. Please check that you have selected supported shape types."
      );
    }

    // Add footer
    this.addFooter();

    return this.mainBuilder.build();
  }

  private generateForNode(node: SceneNode, settings: GcodeSettings): string {
    try {
      const generator = ShapeGeneratorFactory.createGenerator(node.type);
      const globalPos = this.coordinateTransformer.getGlobalCoordinates(node);

      const result = generator.generate(node, globalPos, settings);

      // Validate that we got some meaningful output
      if (!result || result.trim().length === 0) {
        throw new Error(`No G-code generated for ${node.type}`);
      }

      return result;
    } catch (error) {
      console.error(
        `Error generating G-code for node ${node.name || "Unnamed"} (${
          node.type
        }):`,
        error
      );
      throw new Error(
        `Failed to generate G-code for ${node.type}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private addHeader(
    nodes: readonly SceneNode[],
    settings: GcodeSettings
  ): void {
    this.mainBuilder
      .addComment("Generated by Figma to G-code Plugin")
      .addComment(`Date: ${new Date().toISOString()}`)
      .addComment(`Page: ${figma.currentPage.name}`)
      .addComment(`Selected objects: ${nodes.length}`)
      .addComment(`Feed Rate: ${settings.feedRate} mm/min`)
      .addComment(`Rapid Feed Rate: ${settings.rapidFeedRate} mm/min`)
      .addComment(`Laser Power: ${settings.laserPower} (S parameter)`)
      .addComment("")
      .addCommand(
        new SetupCommand(
          settings.feedRate,
          settings.rapidFeedRate,
          settings.laserPower
        )
      )
      .addCommand(new LaserControlCommand(true, true))
      .addComment("");
  }

  private addFooter(): void {
    this.mainBuilder
      .addComment("")
      .addComment("End of G-code")
      .addCommand(new LaserControlCommand(false, true))
      .addCommand(new EndProgramCommand());
  }

  generateFilename(nodes: readonly SceneNode[]): string {
    if (nodes.length === 0) {
      return "gcode";
    }

    // Use the first node's name as base filename
    let baseName = nodes[0].name || "untitled";

    // Clean the name for use as filename (remove invalid characters)
    baseName = baseName.replace(/[<>:"/\\|?*]/g, "_");

    // Add count if multiple nodes
    if (nodes.length > 1) {
      baseName += `_and_${nodes.length - 1}_more`;
    }

    // Add timestamp
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, -5);

    return `${baseName}_${timestamp}`;
  }
}
