import { StarGenerator } from '../generators/star-generator';
import { GcodeBuilderImpl } from '../builder';
import { GcodeSettings } from '../types';
import { createMockStar } from './mock-nodes';

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
  
  interface StarNode extends SceneNode {
    pointCount: number;
    innerRadius: number;
  }
}

describe('StarGenerator', () => {
  let generator: StarGenerator;
  let builder: GcodeBuilderImpl;
  let settings: GcodeSettings;

  beforeEach(() => {
    builder = new GcodeBuilderImpl();
    generator = new StarGenerator(builder);
    settings = {
      feedRate: 1000,
      rapidFeedRate: 3000,
      laserPower: 255
    };
  });

  describe('getShapeType', () => {
    it('should return STAR', () => {
      expect(generator.getShapeType()).toBe('STAR');
    });
  });

  describe('generate', () => {
    it('should generate 5-point star G-code', () => {
      const node = createMockStar({
        name: 'TestStar',
        width: 100,
        height: 100,
        pointCount: 5,
        innerRadius: 0.5
      });
      const globalPos = { x: 0, y: 0 };

      const result = generator.generate(node as any, globalPos, settings);

      // Should contain comment
      expect(result).toContain('; STAR - "TestStar"');
      
      // Should start with move to first outer point
      expect(result).toContain('G0');
      expect(result).toContain('F3000 S0');
      
      // Should have exactly 10 line commands (5 points * 2 for inner/outer)
      const lineCommands = (result.match(/G1/g) || []).length;
      expect(lineCommands).toBe(10);
      
      // All line commands should include laser power and feed rate
      expect(result).toContain('F1000 S255');
    });

    it('should generate 6-point star G-code', () => {
      const node = createMockStar({
        pointCount: 6,
        innerRadius: 0.4,
        width: 80,
        height: 80
      });
      const globalPos = { x: 10, y: 20 };

      const result = generator.generate(node as any, globalPos, settings);

      // Should have exactly 12 line commands (6 points * 2)
      const lineCommands = (result.match(/G1/g) || []).length;
      expect(lineCommands).toBe(12);
      
      // Should have one move command
      const moveCommands = (result.match(/G0/g) || []).length;
      expect(moveCommands).toBe(1);
    });

    it('should handle 3-point star (triangle with inner points)', () => {
      const node = createMockStar({
        pointCount: 3,
        innerRadius: 0.6,
        width: 60,
        height: 60
      });
      const globalPos = { x: 0, y: 0 };

      const result = generator.generate(node as any, globalPos, settings);

      // Should have exactly 6 line commands (3 points * 2)
      const lineCommands = (result.match(/G1/g) || []).length;
      expect(lineCommands).toBe(6);
      
      // Center should be at (30, 30), outer radius 30
      // First outer point should be at top: (30, 0)
      expect(result).toContain('G0 X30.000 Y0.000 F3000 S0');
    });

    it('should handle different inner radius values', () => {
      const node1 = createMockStar({
        pointCount: 5,
        innerRadius: 0.2, // Small inner radius
        width: 50,
        height: 50
      });
      
      const node2 = createMockStar({
        pointCount: 5,
        innerRadius: 0.8, // Large inner radius
        width: 50,
        height: 50
      });
      
      const globalPos = { x: 0, y: 0 };

      const result1 = generator.generate(node1 as any, globalPos, settings);
      const result2 = generator.generate(node2 as any, globalPos, settings);

      // Both should generate star paths but with different inner radii
      expect(result1).toContain('; STAR');
      expect(result2).toContain('; STAR');
      
      // Both should have the same number of line commands
      const lineCommands1 = (result1.match(/G1/g) || []).length;
      const lineCommands2 = (result2.match(/G1/g) || []).length;
      expect(lineCommands1).toBe(lineCommands2);
      expect(lineCommands1).toBe(10); // 5 points * 2
    });

    it('should handle star at custom position', () => {
      const node = createMockStar({
        pointCount: 4,
        innerRadius: 0.5,
        width: 40,
        height: 40
      });
      const globalPos = { x: 25, y: 35 };

      const result = generator.generate(node as any, globalPos, settings);

      // Center should be at (25 + 20, 35 + 20) = (45, 55)
      // First outer point should be at top: (45, 35)
      expect(result).toContain('G0 X45.000 Y35.000 F3000 S0');
      
      // Should have 8 line commands (4 points * 2)
      const lineCommands = (result.match(/G1/g) || []).length;
      expect(lineCommands).toBe(8);
    });

    it('should handle rectangular star dimensions', () => {
      const node = createMockStar({
        pointCount: 5,
        innerRadius: 0.4,
        width: 100,
        height: 50
      });
      const globalPos = { x: 0, y: 0 };

      const result = generator.generate(node as any, globalPos, settings);

      // Should use the smaller dimension for radius calculation
      // Center at (50, 25), outer radius = min(50, 25) = 25
      // First outer point at (50, 0)
      expect(result).toContain('G0 X50.000 Y0.000 F3000 S0');
      
      // Should have 10 line commands
      const lineCommands = (result.match(/G1/g) || []).length;
      expect(lineCommands).toBe(10);
    });

    it('should use custom laser power and feed rates', () => {
      const customSettings: GcodeSettings = {
        feedRate: 600,
        rapidFeedRate: 2400,
        laserPower: 200
      };

      const node = createMockStar({
        pointCount: 5,
        innerRadius: 0.5,
        width: 30,
        height: 30
      });
      const globalPos = { x: 0, y: 0 };

      const result = generator.generate(node as any, globalPos, customSettings);

      expect(result).toContain('F2400 S0'); // Rapid move
      expect(result).toContain('F600 S200'); // Cutting move
    });

    it('should handle very small star', () => {
      const node = createMockStar({
        pointCount: 5,
        innerRadius: 0.5,
        width: 2,
        height: 2
      });
      const globalPos = { x: 5, y: 10 };

      const result = generator.generate(node as any, globalPos, settings);

      // Center at (6, 11), outer radius 1
      expect(result).toContain('G0 X6.000 Y10.000 F3000 S0');
      
      // Should still have 10 line commands
      const lineCommands = (result.match(/G1/g) || []).length;
      expect(lineCommands).toBe(10);
    });

    it('should handle negative coordinates', () => {
      const node = createMockStar({
        pointCount: 5,
        innerRadius: 0.5,
        width: 20,
        height: 20
      });
      const globalPos = { x: -15, y: -25 };

      const result = generator.generate(node as any, globalPos, settings);

      // Center at (-15 + 10, -25 + 10) = (-5, -15)
      // First outer point at (-5, -25)
      expect(result).toContain('G0 X-5.000 Y-25.000 F3000 S0');
    });

    it('should handle extreme inner radius values', () => {
      const nodeSmallInner = createMockStar({
        pointCount: 5,
        innerRadius: 0.1, // Very small inner radius
        width: 40,
        height: 40
      });
      
      const nodeLargeInner = createMockStar({
        pointCount: 5,
        innerRadius: 0.9, // Very large inner radius
        width: 40,
        height: 40
      });
      
      const globalPos = { x: 0, y: 0 };

      const resultSmall = generator.generate(nodeSmallInner as any, globalPos, settings);
      const resultLarge = generator.generate(nodeLargeInner as any, globalPos, settings);

      // Both should generate valid G-code
      expect(resultSmall).toContain('; STAR');
      expect(resultLarge).toContain('; STAR');
      
      // Both should have the same number of line commands
      const lineCommandsSmall = (resultSmall.match(/G1/g) || []).length;
      const lineCommandsLarge = (resultLarge.match(/G1/g) || []).length;
      expect(lineCommandsSmall).toBe(lineCommandsLarge);
    });

    it('should handle zero inner radius', () => {
      const node = createMockStar({
        pointCount: 5,
        innerRadius: 0,
        width: 50,
        height: 50
      });
      const globalPos = { x: 0, y: 0 };

      const result = generator.generate(node as any, globalPos, settings);

      // Should still generate a star (inner points at center)
      expect(result).toContain('; STAR');
      const lineCommands = (result.match(/G1/g) || []).length;
      expect(lineCommands).toBe(10);
    });

    it('should handle large point count', () => {
      const node = createMockStar({
        pointCount: 8,
        innerRadius: 0.5,
        width: 60,
        height: 60
      });
      const globalPos = { x: 0, y: 0 };

      const result = generator.generate(node as any, globalPos, settings);

      const lineCommands = (result.match(/G1/g) || []).length;
      expect(lineCommands).toBe(16); // 8 points * 2
    });

    it('should include node name in comment', () => {
      const node = createMockStar({
        name: 'MyCustomStar',
        pointCount: 5,
        innerRadius: 0.5
      });
      const globalPos = { x: 0, y: 0 };

      const result = generator.generate(node as any, globalPos, settings);

      expect(result).toContain('; STAR - "MyCustomStar"');
    });

    it('should reset builder before generating', () => {
      const node = createMockStar();
      const globalPos = { x: 0, y: 0 };

      // Add some commands to builder first
      builder.addComment('Previous commands');

      const result = generator.generate(node as any, globalPos, settings);

      // Should not contain previous commands
      expect(result).not.toContain('Previous commands');
      expect(result).toContain('; STAR');
    });

    it('should alternate between outer and inner points', () => {
      const node = createMockStar({
        pointCount: 3,
        innerRadius: 0.5,
        width: 30,
        height: 30
      });
      const globalPos = { x: 0, y: 0 };

      const result = generator.generate(node as any, globalPos, settings);

      // Should start at first outer point (15, 0)
      expect(result).toContain('G0 X15.000 Y0.000 F3000 S0');
      
      // Should have 6 line commands alternating between inner and outer points
      const lineCommands = (result.match(/G1/g) || []).length;
      expect(lineCommands).toBe(6);
    });
  });
});