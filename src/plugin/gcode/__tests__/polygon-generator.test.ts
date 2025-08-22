import { PolygonGenerator } from '../generators/polygon-generator';
import { GcodeBuilderImpl } from '../builder';
import { GcodeSettings } from '../types';
import { createMockPolygon } from './mock-nodes';

// Extend global with minimal Figma types for testing
declare global {
  interface SceneNode {
    type: string;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }
  
  interface PolygonNode extends SceneNode {
    pointCount: number;
  }
}

describe('PolygonGenerator', () => {
  let generator: PolygonGenerator;
  let builder: GcodeBuilderImpl;
  let settings: GcodeSettings;

  beforeEach(() => {
    builder = new GcodeBuilderImpl();
    generator = new PolygonGenerator(builder);
    settings = {
      feedRate: 1000,
      rapidFeedRate: 3000,
      laserPower: 255
    };
  });

  describe('getShapeType', () => {
    it('should return POLYGON', () => {
      expect(generator.getShapeType()).toBe('POLYGON');
    });
  });

  describe('generate', () => {
    it('should generate triangle G-code (3 sides)', () => {
      const node = createMockPolygon({
        name: 'TestTriangle',
        width: 100,
        height: 100,
        pointCount: 3
      });
      const globalPos = { x: 0, y: 0 };

      const result = generator.generate(node as any, globalPos, settings);

      // Should contain comment
      expect(result).toContain('; POLYGON - "TestTriangle"');
      
      // Should start with move to first vertex
      expect(result).toContain('G0');
      expect(result).toContain('F3000 S0');
      
      // Should have exactly 3 line commands (one for each side)
      const lineCommands = (result.match(/G1/g) || []).length;
      expect(lineCommands).toBe(3);
      
      // All line commands should include laser power and feed rate
      expect(result).toContain('F1000 S255');
    });

    it('should generate hexagon G-code (6 sides)', () => {
      const node = createMockPolygon({
        name: 'TestHexagon',
        width: 120,
        height: 120,
        pointCount: 6
      });
      const globalPos = { x: 10, y: 20 };

      const result = generator.generate(node as any, globalPos, settings);

      // Should contain comment
      expect(result).toContain('; POLYGON - "TestHexagon"');
      
      // Should have exactly 6 line commands
      const lineCommands = (result.match(/G1/g) || []).length;
      expect(lineCommands).toBe(6);
      
      // Should have one move command
      const moveCommands = (result.match(/G0/g) || []).length;
      expect(moveCommands).toBe(1);
    });

    it('should generate octagon G-code (8 sides)', () => {
      const node = createMockPolygon({
        pointCount: 8,
        width: 80,
        height: 80
      });
      const globalPos = { x: 0, y: 0 };

      const result = generator.generate(node as any, globalPos, settings);

      // Should have exactly 8 line commands
      const lineCommands = (result.match(/G1/g) || []).length;
      expect(lineCommands).toBe(8);
    });

    it('should handle square polygon (4 sides)', () => {
      const node = createMockPolygon({
        pointCount: 4,
        width: 50,
        height: 50
      });
      const globalPos = { x: 0, y: 0 };

      const result = generator.generate(node as any, globalPos, settings);

      // Should have exactly 4 line commands
      const lineCommands = (result.match(/G1/g) || []).length;
      expect(lineCommands).toBe(4);
      
      // Center should be at (25, 25), radius 25
      // First vertex should be at top: (25, 0)
      expect(result).toContain('G0 X25.000 Y0.000 F3000 S0');
    });

    it('should handle polygon at custom position', () => {
      const node = createMockPolygon({
        pointCount: 5,
        width: 60,
        height: 60
      });
      const globalPos = { x: 40, y: 30 };

      const result = generator.generate(node as any, globalPos, settings);

      // Center should be at (40 + 30, 30 + 30) = (70, 60)
      // First vertex should be at top: (70, 30)
      expect(result).toContain('G0 X70.000 Y30.000 F3000 S0');
      
      // Should have exactly 5 line commands for pentagon
      const lineCommands = (result.match(/G1/g) || []).length;
      expect(lineCommands).toBe(5);
    });

    it('should handle rectangular polygon dimensions', () => {
      const node = createMockPolygon({
        pointCount: 6,
        width: 100,
        height: 50
      });
      const globalPos = { x: 0, y: 0 };

      const result = generator.generate(node as any, globalPos, settings);

      // Should use the smaller dimension for radius calculation
      // Center at (50, 25), radius = min(50, 25) = 25
      // First vertex at (50, 0)
      expect(result).toContain('G0 X50.000 Y0.000 F3000 S0');
      
      // Should have 6 line commands
      const lineCommands = (result.match(/G1/g) || []).length;
      expect(lineCommands).toBe(6);
    });

    it('should use custom laser power and feed rates', () => {
      const customSettings: GcodeSettings = {
        feedRate: 750,
        rapidFeedRate: 2800,
        laserPower: 180
      };

      const node = createMockPolygon({
        pointCount: 5,
        width: 40,
        height: 40
      });
      const globalPos = { x: 0, y: 0 };

      const result = generator.generate(node as any, globalPos, customSettings);

      expect(result).toContain('F2800 S0'); // Rapid move
      expect(result).toContain('F750 S180'); // Cutting move
    });

    it('should handle very small polygon', () => {
      const node = createMockPolygon({
        pointCount: 3,
        width: 1,
        height: 1
      });
      const globalPos = { x: 5, y: 10 };

      const result = generator.generate(node as any, globalPos, settings);

      // Center at (5.5, 10.5), radius 0.5
      expect(result).toContain('G0 X5.500 Y10.000 F3000 S0');
      
      // Should still have 3 line commands
      const lineCommands = (result.match(/G1/g) || []).length;
      expect(lineCommands).toBe(3);
    });

    it('should handle negative coordinates', () => {
      const node = createMockPolygon({
        pointCount: 4,
        width: 20,
        height: 20
      });
      const globalPos = { x: -15, y: -25 };

      const result = generator.generate(node as any, globalPos, settings);

      // Center at (-15 + 10, -25 + 10) = (-5, -15)
      // First vertex at (-5, -25)
      expect(result).toContain('G0 X-5.000 Y-25.000 F3000 S0');
    });

    it('should handle minimum point count (3)', () => {
      const node = createMockPolygon({
        pointCount: 3,
        width: 30,
        height: 30
      });
      const globalPos = { x: 0, y: 0 };

      const result = generator.generate(node as any, globalPos, settings);

      const lineCommands = (result.match(/G1/g) || []).length;
      expect(lineCommands).toBe(3);
    });

    it('should handle large point count', () => {
      const node = createMockPolygon({
        pointCount: 12,
        width: 60,
        height: 60
      });
      const globalPos = { x: 0, y: 0 };

      const result = generator.generate(node as any, globalPos, settings);

      const lineCommands = (result.match(/G1/g) || []).length;
      expect(lineCommands).toBe(12);
    });

    it('should handle zero point count gracefully', () => {
      const node = createMockPolygon({
        pointCount: 0,
        width: 50,
        height: 50
      });
      const globalPos = { x: 0, y: 0 };

      const result = generator.generate(node as any, globalPos, settings);

      // Should still generate something (probably no line commands)
      expect(result).toContain('; POLYGON');
      expect(result).toContain('G0');
    });

    it('should include node name in comment', () => {
      const node = createMockPolygon({
        name: 'MyCustomPolygon',
        pointCount: 7
      });
      const globalPos = { x: 0, y: 0 };

      const result = generator.generate(node as any, globalPos, settings);

      expect(result).toContain('; POLYGON - "MyCustomPolygon"');
    });

    it('should reset builder before generating', () => {
      const node = createMockPolygon();
      const globalPos = { x: 0, y: 0 };

      // Add some commands to builder first
      builder.addComment('Previous commands');

      const result = generator.generate(node as any, globalPos, settings);

      // Should not contain previous commands
      expect(result).not.toContain('Previous commands');
      expect(result).toContain('; POLYGON');
    });

    it('should close the polygon by returning to start point', () => {
      const node = createMockPolygon({
        pointCount: 4,
        width: 40,
        height: 40
      });
      const globalPos = { x: 0, y: 0 };

      const result = generator.generate(node as any, globalPos, settings);

      // Should end at the same point where it started
      // First vertex at (20, 0)
      expect(result).toContain('G0 X20.000 Y0.000 F3000 S0');
      
      // Last line should return to the start point
      const lines = result.split('\n').filter(line => line.includes('G1'));
      const lastLine = lines[lines.length - 1];
      expect(lastLine).toContain('X20.000 Y0.000');
    });
  });
});