# G-Code Generation System Refactoring

## Overview

This refactoring transforms the original monolithic `gcode-utils.ts` file into a well-structured, maintainable system using multiple design patterns. The new architecture is more modular, extensible, and follows SOLID principles.

## Design Patterns Applied

### 1. **Strategy Pattern**
- **Purpose**: Encapsulates different algorithms for generating G-code based on shape types
- **Implementation**: `ShapeGenerator` interface with concrete implementations for each shape type
- **Benefits**: Easy to add new shape types without modifying existing code

### 2. **Factory Pattern**
- **Purpose**: Creates appropriate shape generators based on node type
- **Implementation**: `ShapeGeneratorFactory` class
- **Benefits**: Centralizes object creation logic and provides a single point of extension

### 3. **Builder Pattern**
- **Purpose**: Constructs G-code strings step by step
- **Implementation**: `GcodeBuilder` interface and `GcodeBuilderImpl` class
- **Benefits**: Provides a fluent interface for building complex G-code sequences

### 4. **Command Pattern**
- **Purpose**: Encapsulates G-code operations as objects
- **Implementation**: `GcodeCommand` interface with concrete command classes
- **Benefits**: Makes operations reusable, composable, and easier to test

### 5. **Template Method Pattern**
- **Purpose**: Defines common structure for shape generation while allowing variations
- **Implementation**: `BaseShapeGenerator` abstract class
- **Benefits**: Eliminates code duplication and ensures consistent structure

## Architecture Overview

```
src/plugin/gcode/
├── types.ts                     # Core interfaces and types
├── commands.ts                  # Command pattern implementations
├── builder.ts                   # Builder pattern implementation
├── coordinate-transformer.ts    # Coordinate transformation logic
├── gcode-generator.ts          # Main orchestrator class
├── index.ts                    # Public API exports
├── generators/                 # Shape-specific generators (Strategy pattern)
│   ├── base-generator.ts       # Template method base class
│   ├── rectangle-generator.ts  # Rectangle shape strategy
│   ├── ellipse-generator.ts    # Ellipse shape strategy
│   ├── polygon-generator.ts    # Polygon shape strategy
│   ├── star-generator.ts       # Star shape strategy
│   ├── line-generator.ts       # Line shape strategy
│   ├── vector-generator.ts     # Vector shape strategy
│   ├── generic-shape-generator.ts    # Generic fallback strategy
│   ├── compound-shape-generator.ts   # Compound shapes (groups, frames)
│   └── shape-generator-factory.ts    # Factory pattern implementation
└── vector-processing/          # Vector path processing utilities
    └── vector-path-processor.ts
```

## Key Improvements

### 1. **Separation of Concerns**
- Each class has a single responsibility
- Shape generation logic is separated from coordinate transformation
- Command creation is separated from command execution

### 2. **Extensibility**
- Adding new shape types requires only creating a new generator class
- New G-code commands can be added by implementing the `GcodeCommand` interface
- The factory pattern makes it easy to register new generators

### 3. **Maintainability**
- Code is organized into logical modules
- Common functionality is shared through inheritance and composition
- Clear interfaces make the code easier to understand and modify

### 4. **Testability**
- Each component can be tested independently
- Dependencies are injected, making mocking easier
- Command pattern allows testing individual operations

### 5. **Consistency**
- All shape generators follow the same pattern
- G-code formatting is consistent across all shapes
- Error handling is centralized

## Usage Examples

### Basic Usage (Backward Compatible)
```typescript
import { generateGcodeForNode } from "./gcode";

const gcode = generateGcodeForNode(node, 255, 3000, 1000);
```

### Advanced Usage (New API)
```typescript
import { GcodeGenerator } from "./gcode";

const generator = new GcodeGenerator();
const gcode = generator.generateGcode(nodes, 1000, 3000, 255);
```

### Adding New Shape Types
```typescript
// 1. Create a new generator
class CustomShapeGenerator extends BaseShapeGenerator {
  getShapeType(): string {
    return "CUSTOM_SHAPE";
  }

  generate(node: SceneNode, globalPos: Point, settings: GcodeSettings): string {
    this.builder.reset();
    this.addShapeComment("CUSTOM_SHAPE", node.name);

    // Add custom logic here

    return this.builder.build();
  }
}

// 2. Register in the factory
// Add case in ShapeGeneratorFactory.createGenerator()
```

### Adding New Commands
```typescript
class CustomCommand implements GcodeCommand {
  constructor(private parameter: number) {}

  execute(): string {
    return `M123 P${this.parameter} ; Custom command\n`;
  }
}
```

## Benefits of the Refactoring

1. **Reduced Complexity**: The original 943-line monolithic file is now split into focused, manageable modules
2. **Improved Code Reuse**: Common functionality is shared through base classes and utilities
3. **Enhanced Flexibility**: New shapes and commands can be added without modifying existing code
4. **Better Error Handling**: Centralized error handling and validation
5. **Easier Testing**: Each component can be unit tested independently
6. **Clear Interfaces**: Well-defined contracts between components
7. **Backward Compatibility**: Existing code continues to work without changes

## Migration Guide

The refactoring maintains backward compatibility. Existing imports will continue to work:

```typescript
// This still works
import { generateGcodeForNode, laserInlineOn, laserInlineOff } from "./gcode-utils";
```

However, for new development, consider using the new API:

```typescript
// Recommended for new code
import { GcodeGenerator } from "./gcode";
```

## Future Enhancements

The new architecture makes several enhancements easier to implement:

1. **Configuration System**: Settings can be externalized and injected
2. **Plugin System**: New generators can be loaded dynamically
3. **Validation**: Input validation can be added to each generator
4. **Optimization**: G-code optimization passes can be added as decorators
5. **Export Formats**: Multiple output formats can be supported through different builders
6. **Preview System**: Commands can be used to generate preview data without executing
