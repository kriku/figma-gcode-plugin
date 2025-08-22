import { LineGenerator } from '../generators/line-generator';
import { GcodeBuilderImpl } from '../builder';
import { GcodeSettings } from '../types';
import { createMockLine } from './mock-nodes';

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

describe('LineGenerator', () => {
  let generator: LineGenerator;
  let builder: GcodeBuilderImpl;
  let settings: GcodeSettings;

  beforeEach(() => {
    builder = new GcodeBuilderImpl();
    generator = new LineGenerator(builder);
    settings = {
      feedRate: 1000,
      rapidFeedRate: 3000,
      laserPower: 255
    };
  });

  describe('getShapeType', () => {
    it('should return LINE', () => {
      expect(generator.getShapeType()).toBe('LINE');
    });
  });

  describe('generate', () => {
    it('should generate horizontal line G-code', () => {
      const node = createMockLine({
        name: 'TestLine',
        x: 0,
        y: 0,
        width: 100,
        height: 0
      });
      const globalPos = { x: 10, y: 20 };

      const result = generator.generate(node as any, globalPos, settings);

      // Should contain comment
      expect(result).toContain('; LINE - "TestLine"');
      
      // Should start with move to start point
      expect(result).toContain('G0 X10.000 Y20.000 F3000 S0');
      
      // Should draw line to end point
      expect(result).toContain('G1 X110.000 Y20.000 F1000 S255');
      
      // Should have exactly one move and one line command
      const moveCommands = (result.match(/G0/g) || []).length;
      const lineCommands = (result.match(/G1/g) || []).length;
      expect(moveCommands).toBe(1);
      expect(lineCommands).toBe(1);
    });

    it('should generate vertical line G-code', () => {
      const node = createMockLine({
        name: 'VerticalLine',
        width: 0,
        height: 80
      });
      const globalPos = { x: 15, y: 25 };

      const result = generator.generate(node as any, globalPos, settings);

      // Should contain comment
      expect(result).toContain('; LINE - "VerticalLine"');
      
      // Should start with move to start point
      expect(result).toContain('G0 X15.000 Y25.000 F3000 S0');
      
      // Should draw line to end point
      expect(result).toContain('G1 X15.000 Y105.000 F1000 S255');
    });

    it('should generate diagonal line G-code', () => {
      const node = createMockLine({
        width: 60,
        height: 40
      });
      const globalPos = { x: 5, y: 10 };

      const result = generator.generate(node as any, globalPos, settings);

      // Should start with move to start point
      expect(result).toContain('G0 X5.000 Y10.000 F3000 S0');
      
      // Should draw line to end point (5+60, 10+40)
      expect(result).toContain('G1 X65.000 Y50.000 F1000 S255');
    });

    it('should handle line at origin', () => {
      const node = createMockLine({
        width: 50,
        height: 30
      });
      const globalPos = { x: 0, y: 0 };

      const result = generator.generate(node as any, globalPos, settings);

      expect(result).toContain('G0 X0.000 Y0.000 F3000 S0');
      expect(result).toContain('G1 X50.000 Y30.000 F1000 S255');
    });

    it('should handle zero-length line (point)', () => {
      const node = createMockLine({
        width: 0,
        height: 0
      });
      const globalPos = { x: 25, y: 35 };

      const result = generator.generate(node as any, globalPos, settings);

      // Should move to point and draw to same point
      expect(result).toContain('G0 X25.000 Y35.000 F3000 S0');
      expect(result).toContain('G1 X25.000 Y35.000 F1000 S255');
    });

    it('should use custom laser power and feed rates', () => {
      const customSettings: GcodeSettings = {
        feedRate: 800,
        rapidFeedRate: 2500,
        laserPower: 128
      };

      const node = createMockLine({
        width: 40,
        height: 20
      });
      const globalPos = { x: 0, y: 0 };

      const result = generator.generate(node as any, globalPos, customSettings);

      expect(result).toContain('G0 X0.000 Y0.000 F2500 S0');
      expect(result).toContain('G1 X40.000 Y20.000 F800 S128');
    });

    it('should handle negative dimensions', () => {
      const node = createMockLine({
        width: -30,
        height: -20
      });
      const globalPos = { x: 50, y: 60 };

      const result = generator.generate(node as any, globalPos, settings);

      // Start at (50, 60), end at (50-30, 60-20) = (20, 40)
      expect(result).toContain('G0 X50.000 Y60.000 F3000 S0');
      expect(result).toContain('G1 X20.000 Y40.000 F1000 S255');
    });

    it('should handle negative coordinates', () => {
      const node = createMockLine({
        width: 25,
        height: 15
      });
      const globalPos = { x: -10, y: -20 };

      const result = generator.generate(node as any, globalPos, settings);

      expect(result).toContain('G0 X-10.000 Y-20.000 F3000 S0');
      expect(result).toContain('G1 X15.000 Y-5.000 F1000 S255');
    });

    it('should handle very small dimensions', () => {
      const node = createMockLine({
        width: 0.1,
        height: 0.05
      });
      const globalPos = { x: 5.5, y: 10.25 };

      const result = generator.generate(node as any, globalPos, settings);

      expect(result).toContain('G0 X5.500 Y10.250 F3000 S0');
      expect(result).toContain('G1 X5.600 Y10.300 F1000 S255');
    });

    it('should handle very large dimensions', () => {
      const node = createMockLine({
        width: 1000,
        height: 500
      });
      const globalPos = { x: 0, y: 0 };

      const result = generator.generate(node as any, globalPos, settings);

      expect(result).toContain('G0 X0.000 Y0.000 F3000 S0');
      expect(result).toContain('G1 X1000.000 Y500.000 F1000 S255');
    });

    it('should include node name in comment', () => {
      const node = createMockLine({
        name: 'MyCustomLine'
      });
      const globalPos = { x: 0, y: 0 };

      const result = generator.generate(node as any, globalPos, settings);

      expect(result).toContain('; LINE - "MyCustomLine"');
    });

    it('should reset builder before generating', () => {
      const node = createMockLine();
      const globalPos = { x: 0, y: 0 };

      // Add some commands to builder first
      builder.addComment('Previous commands');

      const result = generator.generate(node as any, globalPos, settings);

      // Should not contain previous commands
      expect(result).not.toContain('Previous commands');
      expect(result).toContain('; LINE');
    });

    it('should handle undefined width and height gracefully', () => {
      const node = {
        type: 'LINE',
        name: 'TestLine',
        x: 0,
        y: 0,
        width: undefined,
        height: undefined
      };
      const globalPos = { x: 10, y: 15 };

      const result = generator.generate(node as any, globalPos, settings);

      // Should treat undefined as 0
      expect(result).toContain('G0 X10.000 Y15.000 F3000 S0');
      expect(result).toContain('G1 X10.000 Y15.000 F1000 S255');
    });

    it('should generate proper line direction vectors', () => {
      // Test various line directions to ensure proper vector calculation
      const testCases = [
        { width: 100, height: 0, name: 'horizontal right' },
        { width: 0, height: 100, name: 'vertical down' },
        { width: -100, height: 0, name: 'horizontal left' },
        { width: 0, height: -100, name: 'vertical up' },
        { width: 70.7, height: 70.7, name: 'diagonal down-right' },
        { width: -50, height: 50, name: 'diagonal down-left' }
      ];

      testCases.forEach(testCase => {
        const node = createMockLine({
          width: testCase.width,
          height: testCase.height,
          name: testCase.name
        });
        const globalPos = { x: 0, y: 0 };

        const result = generator.generate(node as any, globalPos, settings);

        // Should always start at global position
        expect(result).toContain('G0 X0.000 Y0.000 F3000 S0');
        
        // Should end at global position + width/height
        const expectedX = (testCase.width || 0).toFixed(3);
        const expectedY = (testCase.height || 0).toFixed(3);
        expect(result).toContain(`G1 X${expectedX} Y${expectedY} F1000 S255`);
      });
    });

    it('should preserve precision for fractional coordinates', () => {
      const node = createMockLine({
        width: 33.333,
        height: 66.667
      });
      const globalPos = { x: 12.5, y: 25.75 };

      const result = generator.generate(node as any, globalPos, settings);

      expect(result).toContain('G0 X12.500 Y25.750 F3000 S0');
      expect(result).toContain('G1 X45.833 Y92.417 F1000 S255');
    });
  });
});