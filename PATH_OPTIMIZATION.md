# G-code Path Optimization

This plugin includes G-code post-processing to minimize laser head travel distance, significantly reducing cutting time and wear on your CNC machine. The optimization system intelligently handles nested Figma structures, flattening groups and frames to optimize individual shapes.

## Features

### Automatic Path Optimization
- **Nested Structure Flattening**: Automatically extracts all drawable shapes from groups, frames, and components
- **Hierarchy-Aware Processing**: Maintains parent path information for debugging while optimizing individual shapes
- **Nearest Neighbor Algorithm**: Calculates the shortest travel distance between all individual shapes
- **Bidirectional Path Analysis**: Considers both start and end points of each shape for optimal routing
- **Shape-Specific Start/End Points**: Uses geometric properties to determine the best cutting entry/exit points
- **Travel Distance Statistics**: Provides before/after comparison with percentage savings

### Supported Shape Types
The optimization system intelligently handles different shape types:

- **Rectangles/Text**: Optimized to start from corners
- **Circles/Ellipses**: Starts at rightmost point for smooth circular motion
- **Lines**: Considers both start and end points for optimal direction
- **Polygons/Stars**: Begins at top vertex for consistent orientation
- **Vector Paths**: Analyzes actual path vertices for precise optimization
- **Complex Shapes**: Falls back to bounding box analysis

### Nested Structure Support
The system automatically handles Figma's hierarchical structures:

- **Groups**: Extracts all shapes within groups for individual optimization
- **Frames**: Processes all child elements recursively
- **Components**: Handles component instances and their contents
- **Mixed Selections**: Optimizes across groups and individual shapes together
- **Deep Nesting**: Traverses multiple levels of hierarchy (Frame > Group > Shape)

**Example**: Selecting 1 group containing 5 shapes results in optimization of all 5 individual shapes, not just the group bounding box.

## How It Works

### 1. Path Segmentation
Each selected object is analyzed to extract:
- Start position (entry point for cutting)
- End position (exit point after cutting)
- Associated G-code commands
- Node metadata (name, type, etc.)

### 2. Travel Distance Calculation
The system calculates Euclidean distances between:
- Current laser position → Next shape start point
- Shape end point → Following shape start point

### 3. Optimization Algorithm
Uses a greedy nearest-neighbor approach:
1. Start from origin (0,0) or specified position
2. Find the closest unprocessed shape
3. Move to that shape and "cut" it
4. Update position to shape's end point
5. Repeat until all shapes are processed

### 4. Bidirectional Analysis
For each shape, the system considers:
- **Forward direction**: Start → End
- **Reverse direction**: End → Start (when applicable)
- Chooses the direction that minimizes total travel

## Usage

### Automatic Optimization
The plugin automatically enables path optimization when multiple objects are selected:

```javascript
// Single object: Uses standard processing
figma.currentPage.selection = [rectangle];

// Multiple objects: Automatically optimizes travel path
figma.currentPage.selection = [rect1, circle1, polygon1];
```

### Manual Control
You can also control optimization programmatically:

```javascript
import { generateOptimizedGcode, generateStandardGcode } from './gcode-utils';

// Force optimization even for single objects
const optimizedGcode = generateOptimizedGcode(
  nodes,
  laserPower,      // 255
  rapidFeedRate,   // 3000
  feedRate,        // 1000
  startPosition    // { x: 0, y: 0 }
);

// Use standard order without optimization
const standardGcode = generateStandardGcode(
  nodes,
  laserPower,
  rapidFeedRate,
  feedRate
);
```

## Generated G-code Features

### Hierarchy Information
The generated G-code includes information about structure flattening:

```gcode
; G-code optimized for minimal laser head travel
; Original selection: 2 node(s)
; Flattened to: 7 drawable shape(s)
; Optimized total travel distance: 245.67 units
; Original travel distance: 432.15 units
; Travel distance saved: 186.48 units (43.2%)
; Processing 7 path segments
```

### Path Annotations
Each optimized path includes full hierarchy information:

```gcode
; --- Path 1/7: Header Group > Logo Background ---
G0 X10.000 Y10.000 F3000 S0
G1 X50.000 Y10.000 F1000 S255
; ... shape cutting commands ...
; --- End Path 1 ---

; --- Path 2/7: Content Frame > Card 1 > Icon Circle ---
; ... next optimized shape ...
```

### Reverse Path Indicators
When a shape is traversed in reverse for optimization:

```gcode
; Path traversed in reverse for optimization
; --- Path 3/5: Circle - MyCircle ---
```

## Performance Benefits

### Typical Savings
- **Individual shapes (2-3)**: 15-30% travel reduction
- **Small groups (4-8 shapes)**: 25-50% travel reduction
- **Large groups (9+ shapes)**: 40-70% travel reduction
- **Mixed selection with nested groups**: 30-60% travel reduction
- **Complex hierarchies**: Up to 80% in optimal cases

### Nested Structure Benefits
- **No lost precision**: Individual shapes optimized instead of group bounding boxes
- **Smart grouping**: Related shapes often stay together when optimal
- **Hierarchy awareness**: Parent information preserved for debugging
- **Flexible selection**: Works with any combination of groups and individual shapes

### Real-world Impact
- **Reduced cutting time**: Less time spent on rapid movements
- **Lower machine wear**: Fewer unnecessary movements
- **Better precision**: Continuous workflow reduces acceleration/deceleration cycles
- **Energy savings**: Less motor movement and spindle idle time

## Best Practices

### Shape Arrangement
For maximum optimization benefit:
1. Group related shapes when possible
2. Avoid widely scattered individual objects
3. Consider shape complexity in your layout

### Starting Position
Specify a custom starting position when your laser head isn't at origin:

```javascript
const gcode = generateOptimizedGcode(
  nodes,
  255, 3000, 1000,
  { x: 100, y: 50 }  // Start from this position
);
```

### Verification
Always verify the optimized path makes sense for your specific cutting job:
1. Check the generated statistics
2. Visualize the path in your G-code viewer
3. Test with simple shapes first

## Limitations

### Current Constraints
- Uses greedy algorithm (not globally optimal)
- Doesn't consider material constraints
- No collision detection for complex geometries
- Fixed laser power throughout operation

### Future Enhancements
Planned improvements include:
- Genetic algorithm for global optimization
- Material-aware cutting order
- Support for different laser powers per shape
- Custom starting position selection in UI

## Technical Details

### Algorithm Complexity
- **Time Complexity**: O(n²) where n is the number of shapes
- **Space Complexity**: O(n) for path storage
- **Memory Usage**: Minimal additional overhead

### Shape Analysis
The system uses different strategies per shape type:

```typescript
interface PathSegment {
  gcode: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  nodeId?: string;
  nodeName?: string;
}
```

Each shape provides:
- Precise entry/exit coordinates
- Pre-generated G-code commands
- Metadata for debugging and statistics
