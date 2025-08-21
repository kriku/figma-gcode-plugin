import { describe, it, expect, beforeEach } from 'vitest';
import { RectangleGenerator } from './rectangle-generator';
import { EllipseGenerator } from './ellipse-generator';
import { LineGenerator } from './line-generator';
import { PolygonGenerator } from './polygon-generator';
import { StarGenerator } from './star-generator';
import { GcodeBuilderImpl } from '../builder';
import { createMockRectangle, createMockEllipse, createMockLine, createMockPolygon, createMockStar, DEFAULT_SETTINGS } from '../../../test-utils';
import { Point } from '../types';

describe('Shape Generators', () => {
  let builder: GcodeBuilderImpl;

  beforeEach(() => {
    builder = new GcodeBuilderImpl();
  });

  describe('RectangleGenerator', () => {
    let generator: RectangleGenerator;

    beforeEach(() => {
      generator = new RectangleGenerator(builder);
    });

    it('should generate correct G-code for a rectangle', () => {
      const node = createMockRectangle(10, 20, 50, 30) as any as SceneNode;
      const globalPos: Point = { x: 10, y: 20 };
      
      const result = generator.generate(node, globalPos, DEFAULT_SETTINGS);
      
      expect(result).toContain('; RECTANGLE - "Test Rectangle"');
      expect(result).toContain('G0 X10.000 Y20.000 F3000 S0'); // Move to start
      expect(result).toContain('G1 X60.000 Y20.000 F1000 S255'); // Right edge
      expect(result).toContain('G1 X60.000 Y50.000 F1000 S255'); // Bottom edge
      expect(result).toContain('G1 X10.000 Y50.000 F1000 S255'); // Left edge
      expect(result).toContain('G1 X10.000 Y20.000 F1000 S255'); // Back to start
    });

    it('should handle rectangles at origin', () => {
      const node = createMockRectangle(0, 0, 100, 100) as any as SceneNode;
      const globalPos: Point = { x: 0, y: 0 };
      
      const result = generator.generate(node, globalPos, DEFAULT_SETTINGS);
      
      expect(result).toContain('G0 X0.000 Y0.000 F3000 S0');
      expect(result).toContain('G1 X100.000 Y0.000 F1000 S255');
      expect(result).toContain('G1 X100.000 Y100.000 F1000 S255');
      expect(result).toContain('G1 X0.000 Y100.000 F1000 S255');
      expect(result).toContain('G1 X0.000 Y0.000 F1000 S255');
    });

    it('should return correct shape type', () => {
      expect(generator.getShapeType()).toBe('RECTANGLE');
    });
  });

  describe('EllipseGenerator', () => {
    let generator: EllipseGenerator;

    beforeEach(() => {
      generator = new EllipseGenerator(builder);
    });

    it('should generate arc commands for perfect circle', () => {
      const node = createMockEllipse(0, 0, 50, 50) as any as SceneNode; // Perfect circle
      const globalPos: Point = { x: 0, y: 0 };
      
      const result = generator.generate(node, globalPos, DEFAULT_SETTINGS);
      
      expect(result).toContain('; ELLIPSE - "Test Ellipse"');
      expect(result).toContain('G0 X50.000 Y25.000 F3000 S0'); // Move to right edge (center(25,25) + radiusX(25))
      expect(result).toContain('G3 X50.000 Y25.000 I-25.000 J0.000 F1000 S255'); // Full circle arc
    });

    it('should generate line segments for ellipse (non-circle)', () => {
      const node = createMockEllipse(10, 20, 60, 40) as any as SceneNode; // Ellipse (width != height)
      const globalPos: Point = { x: 10, y: 20 };
      
      const result = generator.generate(node, globalPos, DEFAULT_SETTINGS);
      
      expect(result).toContain('; ELLIPSE - "Test Ellipse"');
      expect(result).toContain('G0'); // Should have move command
      expect(result).toContain('G1'); // Should have line commands for segments
      expect(result).toContain('F1000 S255'); // Should have feed rate and laser power
    });

    it('should return correct shape type', () => {
      expect(generator.getShapeType()).toBe('ELLIPSE');
    });
  });

  describe('LineGenerator', () => {
    let generator: LineGenerator;

    beforeEach(() => {
      generator = new LineGenerator(builder);
    });

    it('should generate correct G-code for a line', () => {
      const node = createMockLine(5, 10, 30, 20) as any as SceneNode;
      const globalPos: Point = { x: 5, y: 10 };
      
      const result = generator.generate(node, globalPos, DEFAULT_SETTINGS);
      
      expect(result).toContain('; LINE - "Test Line"');
      expect(result).toContain('G0 X5.000 Y10.000 F3000 S0'); // Move to start
      expect(result).toContain('G1 X35.000 Y30.000 F1000 S255'); // Line to end point
    });

    it('should handle horizontal line', () => {
      const node = createMockLine(0, 0, 50, 0) as any as SceneNode;
      const globalPos: Point = { x: 0, y: 0 };
      
      const result = generator.generate(node, globalPos, DEFAULT_SETTINGS);
      
      expect(result).toContain('G0 X0.000 Y0.000 F3000 S0');
      expect(result).toContain('G1 X50.000 Y0.000 F1000 S255');
    });

    it('should handle vertical line', () => {
      const node = createMockLine(0, 0, 0, 50) as any as SceneNode;
      const globalPos: Point = { x: 0, y: 0 };
      
      const result = generator.generate(node, globalPos, DEFAULT_SETTINGS);
      
      expect(result).toContain('G0 X0.000 Y0.000 F3000 S0');
      expect(result).toContain('G1 X0.000 Y50.000 F1000 S255');
    });

    it('should return correct shape type', () => {
      expect(generator.getShapeType()).toBe('LINE');
    });
  });

  describe('PolygonGenerator', () => {
    let generator: PolygonGenerator;

    beforeEach(() => {
      generator = new PolygonGenerator(builder);
    });

    it('should generate correct G-code for a triangle', () => {
      const node = {
        ...createMockPolygon(0, 0, 60, 60),
        pointCount: 3
      } as any as SceneNode;
      const globalPos: Point = { x: 0, y: 0 };
      
      const result = generator.generate(node, globalPos, DEFAULT_SETTINGS);
      
      expect(result).toContain('; POLYGON - "Test Polygon"');
      expect(result).toContain('G0'); // Move command to first vertex
      // Should have 3 line commands (returning to start makes 4 total)
      const lineCommands = (result.match(/G1/g) || []).length;
      expect(lineCommands).toBe(3);
    });

    it('should generate correct G-code for a hexagon', () => {
      const node = {
        ...createMockPolygon(10, 10, 50, 50),
        pointCount: 6
      } as any as SceneNode;
      const globalPos: Point = { x: 10, y: 10 };
      
      const result = generator.generate(node, globalPos, DEFAULT_SETTINGS);
      
      expect(result).toContain('; POLYGON - "Test Polygon"');
      expect(result).toContain('F1000 S255');
      // Should have 6 line commands for hexagon
      const lineCommands = (result.match(/G1/g) || []).length;
      expect(lineCommands).toBe(6);
    });

    it('should return correct shape type', () => {
      expect(generator.getShapeType()).toBe('POLYGON');
    });
  });

  describe('StarGenerator', () => {
    let generator: StarGenerator;

    beforeEach(() => {
      generator = new StarGenerator(builder);
    });

    it('should generate correct G-code for a 5-point star', () => {
      const node = {
        ...createMockStar(0, 0, 100, 100),
        pointCount: 5,
        innerRadius: 0.5
      } as any as SceneNode;
      const globalPos: Point = { x: 0, y: 0 };
      
      const result = generator.generate(node, globalPos, DEFAULT_SETTINGS);
      
      expect(result).toContain('; STAR - "Test Star"');
      expect(result).toContain('G0'); // Move to first point
      expect(result).toContain('F1000 S255');
      // Should have 10 line commands (5 points * 2 for inner/outer)
      const lineCommands = (result.match(/G1/g) || []).length;
      expect(lineCommands).toBe(10);
    });

    it('should generate correct G-code for a 6-point star', () => {
      const node = {
        ...createMockStar(5, 5, 80, 80),
        pointCount: 6,
        innerRadius: 0.4
      } as any as SceneNode;
      const globalPos: Point = { x: 5, y: 5 };
      
      const result = generator.generate(node, globalPos, DEFAULT_SETTINGS);
      
      expect(result).toContain('; STAR - "Test Star"');
      // Should have 12 line commands (6 points * 2 for inner/outer)
      const lineCommands = (result.match(/G1/g) || []).length;
      expect(lineCommands).toBe(12);
    });

    it('should return correct shape type', () => {
      expect(generator.getShapeType()).toBe('STAR');
    });
  });
});