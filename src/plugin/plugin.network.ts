import { PLUGIN, UI } from "@common/networkSides";
import { GcodeGenerator } from "./gcode";

export const PLUGIN_CHANNEL = PLUGIN.channelBuilder()
  .emitsTo(UI, (message) => {
    figma.ui.postMessage(message);
  })
  .receivesFrom(UI, (next) => {
    const listener: MessageEventHandler = (event) => next(event);
    figma.ui.on("message", listener);
    return () => figma.ui.off("message", listener);
  })
  .startListening();

// ---------- Message handlers

PLUGIN_CHANNEL.registerMessageHandler("ping", () => {
  return "pong";
});

PLUGIN_CHANNEL.registerMessageHandler("hello", (text) => {
  console.log("UI side said:", text);
});

PLUGIN_CHANNEL.registerMessageHandler("createRect", (width, height) => {
  if (figma.editorType === "figma") {
    const rect = figma.createRectangle();
    rect.x = 0;
    rect.y = 0;
    rect.name = "Plugin Rectangle # " + Math.floor(Math.random() * 9999);
    rect.fills = [
      {
        type: "SOLID",
        color: {
          r: Math.random(),
          g: Math.random(),
          b: Math.random(),
        },
      },
    ];
    rect.resize(width, height);
    figma.currentPage.appendChild(rect);
    figma.viewport.scrollAndZoomIntoView([rect]);
    figma.closePlugin();
  }
});

PLUGIN_CHANNEL.registerMessageHandler("exportSelection", async () => {
  const selectedNodes = figma.currentPage.selection;
  if (selectedNodes.length === 0) {
    throw new Error(
      "Please select at least one object in Figma before exporting. Supported types include rectangles, ellipses, polygons, stars, lines, vector paths, frames, groups, and more."
    );
  }

  const selection = selectedNodes[0];
  const bytes = await selection.exportAsync({
    format: "PNG",
    contentsOnly: false,
  });

  return "data:image/png;base64," + figma.base64Encode(bytes);
});

PLUGIN_CHANNEL.registerMessageHandler(
  "generateGcode",
  async (feedRate?: number, rapidFeedRate?: number, laserPower?: number) => {
    try {
      // Set default values if not provided
      const feedRateValue = feedRate || 1000;
      const rapidFeedRateValue = rapidFeedRate || 3000;
      const laserPowerValue: number = laserPower || 255;

      const nodes = figma.currentPage.selection;
      if (nodes.length === 0) {
        throw new Error(
          "Please select at least one object in Figma. The plugin supports vector shapes (rectangles, ellipses, polygons, stars, lines, vectors), containers (frames, groups, sections), and other objects (with outline fallback)."
        );
      }

      // All node types are supported via the ShapeGeneratorFactory fallback system
      // Primary shapes get precise tracing, containers process children, others get bounding boxes

      // Use path optimization
      const optimizeTravel = true;
      const generator = new GcodeGenerator(optimizeTravel);
      const gcode = generator.generateGcode(
        nodes,
        feedRateValue,
        rapidFeedRateValue,
        laserPowerValue,
        optimizeTravel
      );

      if (!gcode || gcode.trim().length === 0) {
        throw new Error(
          "Failed to generate G-code from selected objects. Please check that your selection contains valid geometry."
        );
      }

      return gcode;
    } catch (error) {
      // Re-throw with more context if it's our custom error, otherwise create a new descriptive error
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error(
          "An unexpected error occurred while generating G-code. Please check your selection and try again."
        );
      }
    }
  }
);
