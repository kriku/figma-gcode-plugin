import { ShapeGeneratorFactory } from '../generators/shape-generator-factory';
import { RectangleGenerator } from '../generators/rectangle-generator';
import { EllipseGenerator } from '../generators/ellipse-generator';
import { PolygonGenerator } from '../generators/polygon-generator';
import { StarGenerator } from '../generators/star-generator';
import { LineGenerator } from '../generators/line-generator';
import { VectorGenerator } from '../generators/vector-generator';
import { CompoundShapeGenerator } from '../generators/compound-shape-generator';
import { GenericShapeGenerator } from '../generators/generic-shape-generator';

// Extend global with Figma types for testing
declare global {
  interface SceneNode {
    type: string;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    id?: string;
    absoluteBoundingBox?: { x: number; y: number; width: number; height: number };
    parent?: SceneNode;
    vectorNetwork?: VectorNetwork;
  }

  interface VectorNode extends SceneNode {
    vectorNetwork?: VectorNetwork;
    vectorPaths?: VectorPath[];
  }

  interface PolygonNode extends SceneNode {
    pointCount: number;
  }

  interface StarNode extends SceneNode {
    pointCount: number;
    innerRadius: number;
  }

  interface FrameNode extends SceneNode {
    children?: SceneNode[];
  }

  interface GroupNode extends SceneNode {
    children?: SceneNode[];
  }

  interface SectionNode extends SceneNode {
    children?: SceneNode[];
  }

  interface VectorNetwork {
    segments: VectorSegment[];
    vertices: { [key: string]: VectorVertex };
  }

  interface VectorSegment {
    start: number;
    end: number;
    tangentStart?: VectorVertex;
    tangentEnd?: VectorVertex;
  }

  interface VectorVertex {
    x: number;
    y: number;
  }

  interface VectorPath {
    windingRule: string;
    data: string;
  }
}

describe('ShapeGeneratorFactory', () => {
  beforeEach(() => {
    // Clear builders before each test to ensure clean state
    ShapeGeneratorFactory.clearBuilders();
  });

  afterEach(() => {
    // Clear builders after each test
    ShapeGeneratorFactory.clearBuilders();
  });

  describe('createGenerator', () => {
    it('should create RectangleGenerator for RECTANGLE type', () => {
      const generator = ShapeGeneratorFactory.createGenerator('RECTANGLE');
      
      expect(generator).toBeInstanceOf(RectangleGenerator);
      expect(generator.getShapeType()).toBe('RECTANGLE');
    });

    it('should create EllipseGenerator for ELLIPSE type', () => {
      const generator = ShapeGeneratorFactory.createGenerator('ELLIPSE');
      
      expect(generator).toBeInstanceOf(EllipseGenerator);
      expect(generator.getShapeType()).toBe('ELLIPSE');
    });

    it('should create PolygonGenerator for POLYGON type', () => {
      const generator = ShapeGeneratorFactory.createGenerator('POLYGON');
      
      expect(generator).toBeInstanceOf(PolygonGenerator);
      expect(generator.getShapeType()).toBe('POLYGON');
    });

    it('should create StarGenerator for STAR type', () => {
      const generator = ShapeGeneratorFactory.createGenerator('STAR');
      
      expect(generator).toBeInstanceOf(StarGenerator);
      expect(generator.getShapeType()).toBe('STAR');
    });

    it('should create LineGenerator for LINE type', () => {
      const generator = ShapeGeneratorFactory.createGenerator('LINE');
      
      expect(generator).toBeInstanceOf(LineGenerator);
      expect(generator.getShapeType()).toBe('LINE');
    });

    it('should create VectorGenerator for VECTOR type', () => {
      const generator = ShapeGeneratorFactory.createGenerator('VECTOR');
      
      expect(generator).toBeInstanceOf(VectorGenerator);
      expect(generator.getShapeType()).toBe('VECTOR');
    });

    it('should create GenericShapeGenerator for BOOLEAN_OPERATION type', () => {
      const generator = ShapeGeneratorFactory.createGenerator('BOOLEAN_OPERATION');
      
      expect(generator).toBeInstanceOf(GenericShapeGenerator);
      expect(generator.getShapeType()).toBe('BOOLEAN_OPERATION');
    });

    it('should create GenericShapeGenerator for INSTANCE type', () => {
      const generator = ShapeGeneratorFactory.createGenerator('INSTANCE');
      
      expect(generator).toBeInstanceOf(GenericShapeGenerator);
      expect(generator.getShapeType()).toBe('INSTANCE');
    });

    it('should create GenericShapeGenerator for SLICE type', () => {
      const generator = ShapeGeneratorFactory.createGenerator('SLICE');
      
      expect(generator).toBeInstanceOf(GenericShapeGenerator);
      expect(generator.getShapeType()).toBe('SLICE');
    });

    it('should create GenericShapeGenerator for TEXT type', () => {
      const generator = ShapeGeneratorFactory.createGenerator('TEXT');
      
      expect(generator).toBeInstanceOf(GenericShapeGenerator);
      expect(generator.getShapeType()).toBe('TEXT');
    });

    it('should create GenericShapeGenerator for unsupported types', () => {
      const generator = ShapeGeneratorFactory.createGenerator('UNKNOWN_TYPE');
      
      expect(generator).toBeInstanceOf(GenericShapeGenerator);
      expect(generator.getShapeType()).toBe('UNSUPPORTED_UNKNOWN_TYPE');
    });
  });

  describe('compound shape generators', () => {
    beforeEach(() => {
      // Set up a mock node processor for compound shapes
      const mockNodeProcessor = jest.fn().mockReturnValue('mock-gcode');
      ShapeGeneratorFactory.setNodeProcessor(mockNodeProcessor);
    });

    it('should create CompoundShapeGenerator for FRAME type', () => {
      const generator = ShapeGeneratorFactory.createGenerator('FRAME');
      
      expect(generator).toBeInstanceOf(CompoundShapeGenerator);
      expect(generator.getShapeType()).toBe('COMPOUND');
    });

    it('should create CompoundShapeGenerator for GROUP type', () => {
      const generator = ShapeGeneratorFactory.createGenerator('GROUP');
      
      expect(generator).toBeInstanceOf(CompoundShapeGenerator);
      expect(generator.getShapeType()).toBe('COMPOUND');
    });

    it('should create CompoundShapeGenerator for SECTION type', () => {
      const generator = ShapeGeneratorFactory.createGenerator('SECTION');
      
      expect(generator).toBeInstanceOf(CompoundShapeGenerator);
      expect(generator.getShapeType()).toBe('COMPOUND');
    });

    it('should throw error for compound types without node processor', () => {
      // Clear node processor
      ShapeGeneratorFactory.setNodeProcessor(null as any);

      expect(() => {
        ShapeGeneratorFactory.createGenerator('FRAME');
      }).toThrow('Node processor must be set before creating compound generators');
    });
  });

  describe('setNodeProcessor', () => {
    it('should set node processor successfully', () => {
      const mockProcessor = jest.fn();
      
      expect(() => {
        ShapeGeneratorFactory.setNodeProcessor(mockProcessor);
      }).not.toThrow();
    });

    it('should allow creating compound generators after setting processor', () => {
      const mockProcessor = jest.fn().mockReturnValue('test-gcode');
      ShapeGeneratorFactory.setNodeProcessor(mockProcessor);

      const generator = ShapeGeneratorFactory.createGenerator('FRAME');
      expect(generator).toBeInstanceOf(CompoundShapeGenerator);
    });
  });

  describe('builder management', () => {
    it('should reuse builders for same node type', () => {
      const generator1 = ShapeGeneratorFactory.createGenerator('RECTANGLE');
      const generator2 = ShapeGeneratorFactory.createGenerator('RECTANGLE');
      
      // Both generators should work (we can't directly test builder reuse due to encapsulation)
      expect(generator1).toBeInstanceOf(RectangleGenerator);
      expect(generator2).toBeInstanceOf(RectangleGenerator);
    });

    it('should create separate builders for different node types', () => {
      const rectGenerator = ShapeGeneratorFactory.createGenerator('RECTANGLE');
      const ellipseGenerator = ShapeGeneratorFactory.createGenerator('ELLIPSE');
      
      expect(rectGenerator).toBeInstanceOf(RectangleGenerator);
      expect(ellipseGenerator).toBeInstanceOf(EllipseGenerator);
      expect(rectGenerator.getShapeType()).toBe('RECTANGLE');
      expect(ellipseGenerator.getShapeType()).toBe('ELLIPSE');
    });

    it('should clear all builders when clearBuilders is called', () => {
      // Create some generators to populate the builders map
      ShapeGeneratorFactory.createGenerator('RECTANGLE');
      ShapeGeneratorFactory.createGenerator('ELLIPSE');
      
      // Clear builders
      ShapeGeneratorFactory.clearBuilders();
      
      // Should still be able to create new generators
      const generator = ShapeGeneratorFactory.createGenerator('POLYGON');
      expect(generator).toBeInstanceOf(PolygonGenerator);
    });
  });

  describe('factory pattern consistency', () => {
    it('should return same generator type for multiple calls with same node type', () => {
      const nodeType = 'STAR';
      
      const generator1 = ShapeGeneratorFactory.createGenerator(nodeType);
      const generator2 = ShapeGeneratorFactory.createGenerator(nodeType);
      
      expect(generator1.constructor).toBe(generator2.constructor);
      expect(generator1.getShapeType()).toBe(generator2.getShapeType());
    });

    it('should handle case sensitivity correctly', () => {
      // Assuming the factory is case-sensitive
      const upperGenerator = ShapeGeneratorFactory.createGenerator('RECTANGLE');
      const lowerGenerator = ShapeGeneratorFactory.createGenerator('rectangle');
      
      expect(upperGenerator).toBeInstanceOf(RectangleGenerator);
      expect(lowerGenerator).toBeInstanceOf(GenericShapeGenerator);
      expect(lowerGenerator.getShapeType()).toBe('UNSUPPORTED_rectangle');
    });

    it('should handle empty string gracefully', () => {
      const generator = ShapeGeneratorFactory.createGenerator('');
      
      expect(generator).toBeInstanceOf(GenericShapeGenerator);
      expect(generator.getShapeType()).toBe('UNSUPPORTED_');
    });

    it('should handle null/undefined input gracefully', () => {
      const generator1 = ShapeGeneratorFactory.createGenerator(null as any);
      const generator2 = ShapeGeneratorFactory.createGenerator(undefined as any);
      
      expect(generator1).toBeInstanceOf(GenericShapeGenerator);
      expect(generator2).toBeInstanceOf(GenericShapeGenerator);
    });
  });

  describe('integration with specific generators', () => {
    it('should create functional rectangle generator', () => {
      const generator = ShapeGeneratorFactory.createGenerator('RECTANGLE');
      const mockNode = {
        type: 'RECTANGLE',
        name: 'test',
        x: 0,
        y: 0,
        width: 100,
        height: 50
      };
      const globalPos = { x: 0, y: 0 };
      const settings = {
        feedRate: 1000,
        rapidFeedRate: 3000,
        laserPower: 255
      };

      const result = generator.generate(mockNode as any, globalPos, settings);
      
      expect(result).toContain('; RECTANGLE');
      expect(result).toContain('G0');
      expect(result).toContain('G1');
    });

    it('should create functional ellipse generator', () => {
      const generator = ShapeGeneratorFactory.createGenerator('ELLIPSE');
      const mockNode = {
        type: 'ELLIPSE',
        name: 'test',
        x: 0,
        y: 0,
        width: 100,
        height: 100
      };
      const globalPos = { x: 0, y: 0 };
      const settings = {
        feedRate: 1000,
        rapidFeedRate: 3000,
        laserPower: 255
      };

      const result = generator.generate(mockNode as any, globalPos, settings);
      
      expect(result).toContain('; ELLIPSE');
      expect(result).toContain('G0');
      // Circle should use arc commands
      expect(result).toContain('G3');
    });
  });
});