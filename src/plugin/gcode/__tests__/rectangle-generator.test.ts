import { RectangleGenerator } from '../generators/rectangle-generator';
import { GcodeBuilderImpl } from '../builder';
import { GcodeSettings } from '../types';
import { createMockRectangle } from './mock-nodes';

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

describe('RectangleGenerator', () => {
  let generator: RectangleGenerator;
  let builder: GcodeBuilderImpl;
  let settings: GcodeSettings;

  beforeEach(() => {
    builder = new GcodeBuilderImpl();
    generator = new RectangleGenerator(builder);
    settings = {
      feedRate: 1000,
      rapidFeedRate: 3000,
      laserPower: 255
    };
  });

  describe('getShapeType', () => {
    it('should return RECTANGLE', () => {
      expect(generator.getShapeType()).toBe('RECTANGLE');
    });
  });

  describe('generate', () => {
    it('should generate rectangle G-code at origin', () => {
      const node = createMockRectangle({
        name: 'TestRect',
        width: 50,
        height: 30
      });
      const globalPos = { x: 0, y: 0 };

      const result = generator.generate(node as any, globalPos, settings);

      // Should contain comment
      expect(result).toContain('; RECTANGLE - "TestRect"');
      
      // Should start with move to origin
      expect(result).toContain('G0 X0.000 Y0.000 F3000 S0');
      
      // Should draw rectangle perimeter
      expect(result).toContain('G1 X50.000 Y0.000 F1000 S255'); // Right edge
      expect(result).toContain('G1 X50.000 Y30.000 F1000 S255'); // Bottom edge
      expect(result).toContain('G1 X0.000 Y30.000 F1000 S255');  // Left edge
      expect(result).toContain('G1 X0.000 Y0.000 F1000 S255');   // Back to start
    });

    it('should generate rectangle G-code at custom position', () => {
      const node = createMockRectangle({
        width: 100,
        height: 80
      });
      const globalPos = { x: 25, y: 15 };

      const result = generator.generate(node as any, globalPos, settings);

      // Should start with move to custom position
      expect(result).toContain('G0 X25.000 Y15.000 F3000 S0');
      
      // Should draw rectangle at offset position
      expect(result).toContain('G1 X125.000 Y15.000 F1000 S255'); // Right edge
      expect(result).toContain('G1 X125.000 Y95.000 F1000 S255');  // Bottom edge
      expect(result).toContain('G1 X25.000 Y95.000 F1000 S255');   // Left edge
      expect(result).toContain('G1 X25.000 Y15.000 F1000 S255');   // Back to start
    });

    it('should handle square dimensions', () => {
      const node = createMockRectangle({
        width: 50,
        height: 50
      });
      const globalPos = { x: 10, y: 20 };

      const result = generator.generate(node as any, globalPos, settings);

      expect(result).toContain('G0 X10.000 Y20.000 F3000 S0');
      expect(result).toContain('G1 X60.000 Y20.000 F1000 S255');
      expect(result).toContain('G1 X60.000 Y70.000 F1000 S255');
      expect(result).toContain('G1 X10.000 Y70.000 F1000 S255');
      expect(result).toContain('G1 X10.000 Y20.000 F1000 S255');
    });

    it('should handle zero-width rectangle', () => {
      const node = createMockRectangle({
        width: 0,
        height: 50
      });
      const globalPos = { x: 5, y: 10 };

      const result = generator.generate(node as any, globalPos, settings);

      // Should still generate commands, resulting in a vertical line
      expect(result).toContain('G0 X5.000 Y10.000 F3000 S0');
      expect(result).toContain('G1 X5.000 Y10.000 F1000 S255'); // Same point
      expect(result).toContain('G1 X5.000 Y60.000 F1000 S255'); // Bottom
      expect(result).toContain('G1 X5.000 Y60.000 F1000 S255'); // Same point
      expect(result).toContain('G1 X5.000 Y10.000 F1000 S255'); // Back to start
    });

    it('should handle zero-height rectangle', () => {
      const node = createMockRectangle({
        width: 50,
        height: 0
      });
      const globalPos = { x: 5, y: 10 };

      const result = generator.generate(node as any, globalPos, settings);

      // Should still generate commands, resulting in a horizontal line
      expect(result).toContain('G0 X5.000 Y10.000 F3000 S0');
      expect(result).toContain('G1 X55.000 Y10.000 F1000 S255'); // Right
      expect(result).toContain('G1 X55.000 Y10.000 F1000 S255'); // Same point
      expect(result).toContain('G1 X5.000 Y10.000 F1000 S255');  // Left
      expect(result).toContain('G1 X5.000 Y10.000 F1000 S255');  // Back to start
    });

    it('should use custom laser power and feed rates', () => {
      const customSettings: GcodeSettings = {
        feedRate: 500,
        rapidFeedRate: 2000,
        laserPower: 128
      };

      const node = createMockRectangle({
        width: 20,
        height: 30
      });
      const globalPos = { x: 0, y: 0 };

      const result = generator.generate(node as any, globalPos, customSettings);

      expect(result).toContain('G0 X0.000 Y0.000 F2000 S0');
      expect(result).toContain('G1 X20.000 Y0.000 F500 S128');
      expect(result).toContain('G1 X20.000 Y30.000 F500 S128');
      expect(result).toContain('G1 X0.000 Y30.000 F500 S128');
      expect(result).toContain('G1 X0.000 Y0.000 F500 S128');
    });

    it('should handle negative coordinates', () => {
      const node = createMockRectangle({
        width: 40,
        height: 60
      });
      const globalPos = { x: -20, y: -30 };

      const result = generator.generate(node as any, globalPos, settings);

      expect(result).toContain('G0 X-20.000 Y-30.000 F3000 S0');
      expect(result).toContain('G1 X20.000 Y-30.000 F1000 S255');
      expect(result).toContain('G1 X20.000 Y30.000 F1000 S255');
      expect(result).toContain('G1 X-20.000 Y30.000 F1000 S255');
      expect(result).toContain('G1 X-20.000 Y-30.000 F1000 S255');
    });

    it('should handle very small dimensions', () => {
      const node = createMockRectangle({
        width: 0.1,
        height: 0.2
      });
      const globalPos = { x: 5.5, y: 10.75 };

      const result = generator.generate(node as any, globalPos, settings);

      expect(result).toContain('G0 X5.500 Y10.750 F3000 S0');
      expect(result).toContain('G1 X5.600 Y10.750 F1000 S255');
      expect(result).toContain('G1 X5.600 Y10.950 F1000 S255');
      expect(result).toContain('G1 X5.500 Y10.950 F1000 S255');
      expect(result).toContain('G1 X5.500 Y10.750 F1000 S255');
    });

    it('should include node name in comment', () => {
      const node = createMockRectangle({
        name: 'MyCustomRectangle'
      });
      const globalPos = { x: 0, y: 0 };

      const result = generator.generate(node as any, globalPos, settings);

      expect(result).toContain('; RECTANGLE - "MyCustomRectangle"');
    });

    it('should reset builder before generating', () => {
      const node = createMockRectangle();
      const globalPos = { x: 0, y: 0 };

      // Add some commands to builder first
      builder.addComment('Previous commands');

      const result = generator.generate(node as any, globalPos, settings);

      // Should not contain previous commands
      expect(result).not.toContain('Previous commands');
      expect(result).toContain('; RECTANGLE');
    });
  });
});