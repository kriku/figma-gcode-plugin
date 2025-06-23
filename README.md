<!-- Logo -->
<p align="center">
  <!-- <img src="path/to/your/logo.png" height="100px" alt="Marlin G-Code Generator Logo"/> -->
  🔥⚡
</p>
<h1 align="center">Figma Plugin: Marlin G-Code Generator</h1>

<!-- Slogan -->
<p align="center">
   Convert your Figma designs into G-code for laser cutting and engraving with Marlin firmware!

  <img width="1600" alt="Screenshot 2025-06-23 at 10 29 36 PM" src="https://github.com/user-attachments/assets/3b10584f-e960-4c3e-bfcd-d805521864eb" />
</p>

# 🗝 Key Features

1. **_G-Code Generation:_** Convert Figma vector shapes (rectangles, circles, ellipses, polygons, and complex paths) into precise G-code commands for laser cutting and engraving.

2. **_Marlin Firmware Compatibility:_** Generates G-code specifically optimized for Marlin firmware with proper laser control commands (M3, M5) and inline mode support.

3. **_Vector Path Processing:_** Handles complex Figma vector paths including straight lines, curves, and arcs with accurate coordinate transformation.

4. **_Laser Power Control:_** Supports configurable laser power settings with safe rapid positioning (G0 with S0) and controlled cutting movements (G1 with laser power).

5. **_React + Vite Architecture:_** Built on a modern development stack with hot reload, TypeScript support, and optimized bundling for Figma plugin deployment.

6. **_Real-time Preview:_** Interactive UI for configuring G-code generation parameters and previewing output before export.

# 💻 How to Use

## Quick Start

1. Install dependencies:
```
npm install
```

2. Create a new Figma plugin:
   - In Figma, right-click in a design file
   - Go to `Plugins > Development > New Plugin...`
   - Choose `Default` layout and save the manifest to get the plugin ID

3. Configure the plugin:
   - Copy the generated plugin ID from the temporary manifest.json
   - Update `figma.manifest.ts` with your plugin ID and desired settings

4. Start development:
```
npm run dev
```

5. Load the plugin in Figma:
   - Right-click in Figma → `Plugins > Development > Import plugin from manifest...`
   - Select `dist/manifest.json`

## Using the G-Code Generator

1. **Select Vector Objects**: Choose rectangles, circles, ellipses, polygons, or vector paths in your Figma design
2. **Configure Settings**: Set laser power, feed rates, and cutting parameters in the plugin UI
3. **Generate G-Code**: Click generate to convert selected objects to G-code
4. **Export**: Copy or download the generated G-code for your laser cutter

### Supported Figma Objects

- **Rectangles**: Converted to G-code paths with proper corner handling
- **Circles & Ellipses**: Generated using G2/G3 arc commands for smooth curves
- **Polygons**: Each edge converted to linear interpolation commands
- **Vector Paths**: Complex curves and bezier paths processed into linear segments
- **Groups**: Processes all vector children recursively

## 🖱 Development

Development workflow for the G-code generator plugin:

```
npm run dev
```

Once running, the `dist/` folder will contain your built plugin files including `manifest.json`. Load it in Figma using `Right Click > Plugins > Development > Import plugin from manifest...`

> [!TIP]
> Enable `Hot reload plugin` in Figma to automatically reload when files in `dist/` change during development.

### 🦴 UI Development Mode

Develop and test the plugin UI in a browser without Figma context:

```
npm run dev:ui-only
```

> [!NOTE]
> Figma API calls will not work in "ui-only" mode, but you can develop the interface and G-code generation logic.

### 🔧 G-Code Development

The core G-code generation logic is in `src/plugin/gcode-utils.ts`. This module includes:

- **Laser Control**: `laserInlineOn()`, `laserInlineOff()` for M3/M5 commands
- **Movement**: `moveTo()` for rapid positioning (G0), `lineTo()` for cutting (G1)
- **Arcs**: `arcTo()` for circular interpolation (G2/G3)
- **Shape Generators**: Specialized functions for circles, ellipses, rectangles, and paths

## 🔨 Building

Build the plugin for production deployment:

```
npm run build
```

The `dist` folder will contain all files needed for the plugin:
- `manifest.json` - Plugin configuration
- `plugin.js` - Main plugin logic with G-code generation
- `index.html` - Plugin UI

Load the built plugin in Figma: `Right Click > Plugins > Development > Import plugin from manifest...` and select `dist/manifest.json`

## 📦 Publishing

After building, the `dist` folder contains everything needed to publish your G-code generator plugin:

1. Test the plugin thoroughly with various Figma shapes
2. Follow [Figma's Official Publishing Guide](https://help.figma.com/hc/en-us/articles/360042293394-Publish-plugins-to-the-Figma-Community#Publish_your_plugin)
3. Submit for review with clear documentation about G-code compatibility and safety considerations

## 🕸 Project Structure

- `src`
  - `src/common/` : Shared code between plugin and UI sides
    - `src/common/networkSides.ts` : Event definitions for plugin ↔ UI communication
  - `src/plugin/` : Main plugin logic (runs in Figma's plugin context)
    - `src/plugin/gcode-utils.ts` : Core G-code generation functions and utilities
    - `src/plugin/plugin.ts` : Main plugin entry point and Figma API interactions
    - `src/plugin/plugin.network.ts` : Plugin-side network event handlers
  - `src/ui/` : Plugin UI (React + Vite)
    - `src/ui/app.tsx` : Main UI component with G-code generation controls
    - `src/ui/app.network.tsx` : UI-side network event handlers
    - `src/ui/components/` : Reusable UI components
    - `src/ui/styles/` : SCSS styles with 7-1 architecture
- `scripts/` : Build and utility scripts
- `figma.manifest.ts` : Figma plugin manifest configuration

### G-Code Generation Flow

1. **Selection**: User selects vector objects in Figma
2. **Analysis**: Plugin analyzes object types and properties
3. **Conversion**: `gcode-utils.ts` converts shapes to G-code commands
4. **Output**: Generated G-code is formatted and presented to user

# 🛑 Important Safety Notes

### ⚠️ Laser Safety

**ALWAYS follow proper laser safety protocols when using generated G-code:**

1. **Test First**: Always test G-code on scrap material before cutting final pieces
2. **Power Settings**: Verify laser power settings are appropriate for your material
3. **Safety Equipment**: Use proper eye protection and ventilation
4. **Machine Limits**: Ensure generated coordinates are within your machine's working area
5. **Emergency Stop**: Know how to quickly stop your laser cutter

### 🔧 G-Code Compatibility

- **Marlin Firmware**: G-code is optimized for Marlin firmware with laser support
- **Coordinate System**: Uses absolute coordinates (G90 mode assumed)
- **Units**: All coordinates are in millimeters
- **Origin**: Assumes origin (0,0) at bottom-left of work area

## 🎯 Usage Tips

### Best Practices

1. **Vector Only**: Only vector objects generate G-code (no raster images)
2. **Scale Checking**: Verify Figma units match your intended cut size
3. **Path Direction**: Complex paths are processed left-to-right, top-to-bottom
4. **Group Organization**: Use Figma groups to organize cutting operations
5. **Layer Order**: Consider stacking order for cut sequence planning

### Troubleshooting

- **Empty Output**: Ensure you've selected vector objects, not images or text
- **Coordinate Issues**: Check that your design fits within machine limits
- **Arc Problems**: Very small curves may be converted to line segments
- **Performance**: Large, complex paths may take time to process

---

## 🙏 Acknowledgments

This plugin is built on the excellent [Figma Plugin React Vite Template](https://github.com/CoconutGoodie/figma-plugin-react-vite) by [@CoconutGoodie](https://github.com/CoconutGoodie).

### Tech Stack

- **Figma Plugin API** - Plugin integration and shape data access
- **React + TypeScript** - Modern UI development
- **Vite** - Fast build tooling and hot reload
- **SCSS** - Styling with 7-1 architecture
- **Monorepo Networker** - Plugin ↔ UI communication

# 📜 License

&copy; 2024 G-Code Generator for Figma

This project is licensed under the [MIT License](LICENSE).

## Template License

The original template is licensed under [Attribution-ShareAlike 4.0 International](http://creativecommons.org/licenses/by-sa/4.0/) by Taha Anılcan Metinyurt (iGoodie).
