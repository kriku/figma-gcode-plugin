import { EllipseGenerator } from '../generators/ellipse-generator';
import { GcodeBuilderImpl } from '../builder';
import { GcodeSettings } from '../types';
import { createMockEllipse } from './mock-nodes';

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
}

describe('EllipseGenerator', () => {
  let generator: EllipseGenerator;
  let builder: GcodeBuilderImpl;
  let settings: GcodeSettings;

  beforeEach(() => {
    builder = new GcodeBuilderImpl();
    generator = new EllipseGenerator(builder);
    settings = {
      feedRate: 1000,
      rapidFeedRate: 3000,
      laserPower: 255
    };
  });

  describe('getShapeType', () => {
    it('should return ELLIPSE', () => {
      expect(generator.getShapeType()).toBe('ELLIPSE');
    });
  });

  describe('generate', () => {
    it('should generate circle G-code when width equals height', () => {
      const node = createMockEllipse({
        name: 'TestCircle',
        width: 100,
        height: 100
      });
      const globalPos = { x: 0, y: 0 };

      const result = generator.generate(node as any, globalPos, settings);

      // Should contain comment
      expect(result).toContain('; ELLIPSE - "TestCircle"');
      
      // Perfect circle should use arc commands
      // Center at (50, 50), radius 50
      // Start at rightmost point: (100, 50)
      expect(result).toContain('G0 X100.000 Y50.000 F3000 S0');
      
      // Should contain arc command (G3 for counter-clockwise)
      expect(result).toContain('G3 X100.000 Y50.000 I-50.000 J0.000 F1000 S255');
    });

    it('should generate ellipse G-code using line segments when width != height', () => {
      const node = createMockEllipse({
        name: 'TestEllipse',
        width: 120,
        height: 80
      });
      const globalPos = { x: 10, y: 20 };

      const result = generator.generate(node as any, globalPos, settings);

      // Should contain comment
      expect(result).toContain('; ELLIPSE - "TestEllipse"');
      
      // Should use line segments for ellipse
      // Should start with move command
      expect(result).toContain('G0');
      
      // Should contain multiple line commands for ellipse approximation
      const lineCommands = (result.match(/G1/g) || []).length;
      expect(lineCommands).toBeGreaterThan(10); // Should have multiple segments
      
      // All line commands should have laser power and feed rate
      expect(result).toContain('F1000 S255');
    });

    it('should handle circle at custom position', () => {
      const node = createMockEllipse({
        width: 60,
        height: 60
      });
      const globalPos = { x: 25, y: 35 };

      const result = generator.generate(node as any, globalPos, settings);

      // Center should be at (25 + 30, 35 + 30) = (55, 65)
      // Start at rightmost point: (85, 65)
      expect(result).toContain('G0 X85.000 Y65.000 F3000 S0');
      expect(result).toContain('G3 X85.000 Y65.000 I-30.000 J0.000 F1000 S255');
    });

    it('should handle very small circle', () => {
      const node = createMockEllipse({
        width: 2,
        height: 2
      });
      const globalPos = { x: 0, y: 0 };

      const result = generator.generate(node as any, globalPos, settings);

      // Center at (1, 1), radius 1
      // Start at (2, 1)
      expect(result).toContain('G0 X2.000 Y1.000 F3000 S0');
      expect(result).toContain('G3 X2.000 Y1.000 I-1.000 J0.000 F1000 S255');
    });

    it('should handle ellipse with large width-to-height ratio', () => {
      const node = createMockEllipse({
        width: 200,
        height: 50
      });
      const globalPos = { x: 0, y: 0 };

      const result = generator.generate(node as any, globalPos, settings);

      // Should use line segments for ellipse
      expect(result).toContain('; ELLIPSE');
      
      // Should have multiple line commands
      const lineCommands = (result.match(/G1/g) || []).length;
      expect(lineCommands).toBeGreaterThan(20); // More segments for larger ellipse
    });

    it('should handle ellipse with large height-to-width ratio', () => {
      const node = createMockEllipse({
        width: 40,
        height: 160
      });
      const globalPos = { x: 5, y: 10 };

      const result = generator.generate(node as any, globalPos, settings);

      // Should use line segments for ellipse
      expect(result).toContain('; ELLIPSE');
      
      // Should have multiple line commands
      const lineCommands = (result.match(/G1/g) || []).length;
      expect(lineCommands).toBeGreaterThan(20);
    });

    it('should use custom laser power and feed rates', () => {
      const customSettings: GcodeSettings = {
        feedRate: 800,
        rapidFeedRate: 2500,
        laserPower: 128
      };

      const node = createMockEllipse({
        width: 50,
        height: 50
      });
      const globalPos = { x: 0, y: 0 };

      const result = generator.generate(node as any, globalPos, customSettings);

      expect(result).toContain('G0 X50.000 Y25.000 F2500 S0');
      expect(result).toContain('G3 X50.000 Y25.000 I-25.000 J0.000 F800 S128');
    });

    it('should handle zero-width ellipse', () => {
      const node = createMockEllipse({
        width: 0,
        height: 50
      });
      const globalPos = { x: 10, y: 20 };

      const result = generator.generate(node as any, globalPos, settings);

      // Should generate something (probably degenerate case)
      expect(result).toContain('; ELLIPSE');
      expect(result).toContain('G0');
    });

    it('should handle zero-height ellipse', () => {
      const node = createMockEllipse({
        width: 50,
        height: 0
      });
      const globalPos = { x: 10, y: 20 };

      const result = generator.generate(node as any, globalPos, settings);

      // Should generate something (probably degenerate case)
      expect(result).toContain('; ELLIPSE');
      expect(result).toContain('G0');
    });

    it('should handle negative coordinates', () => {
      const node = createMockEllipse({
        width: 40,
        height: 40
      });
      const globalPos = { x: -30, y: -40 };

      const result = generator.generate(node as any, globalPos, settings);

      // Center at (-30 + 20, -40 + 20) = (-10, -20)
      // Start at (-10 + 20, -20) = (10, -20)
      expect(result).toContain('G0 X10.000 Y-20.000 F3000 S0');
      expect(result).toContain('G3 X10.000 Y-20.000 I-20.000 J0.000 F1000 S255');
    });

    it('should include node name in comment', () => {
      const node = createMockEllipse({
        name: 'MyCustomEllipse'
      });
      const globalPos = { x: 0, y: 0 };

      const result = generator.generate(node as any, globalPos, settings);

      expect(result).toContain('; ELLIPSE - "MyCustomEllipse"');
    });

    it('should reset builder before generating', () => {
      const node = createMockEllipse();
      const globalPos = { x: 0, y: 0 };

      // Add some commands to builder first
      builder.addComment('Previous commands');

      const result = generator.generate(node as any, globalPos, settings);

      // Should not contain previous commands
      expect(result).not.toContain('Previous commands');
      expect(result).toContain('; ELLIPSE');
    });
  });
});