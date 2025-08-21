import { describe, it, expect, beforeEach } from 'vitest';
import { GcodeGenerator } from './gcode-generator';
import { createMockRectangle, createMockEllipse, createMockLine, DEFAULT_SETTINGS } from '../../test-utils';

describe('GcodeGenerator', () => {
  let generator: GcodeGenerator;

  beforeEach(() => {
    generator = new GcodeGenerator();
  });

  describe('constructor', () => {
    it('should create generator with default optimization disabled', () => {
      const gen = new GcodeGenerator();
      expect(gen).toBeDefined();
    });

    it('should create generator with optimization enabled', () => {
      const gen = new GcodeGenerator(true);
      expect(gen).toBeDefined();
    });
  });

  describe('generateGcode', () => {
    it('should throw error when no nodes provided', () => {
      expect(() => {
        generator.generateGcode([]);
      }).toThrow('No nodes provided for G-code generation.');
    });

    it('should throw error for invalid feed rate', () => {
      const nodes = [createMockRectangle() as any as SceneNode];
      
      expect(() => {
        generator.generateGcode(nodes, 0); // Invalid feed rate
      }).toThrow('Invalid parameters: feed rates must be positive and laser power must be non-negative.');
    });

    it('should throw error for invalid rapid feed rate', () => {
      const nodes = [createMockRectangle() as any as SceneNode];
      
      expect(() => {
        generator.generateGcode(nodes, 1000, -100); // Invalid rapid feed rate
      }).toThrow('Invalid parameters: feed rates must be positive and laser power must be non-negative.');
    });

    it('should throw error for negative laser power', () => {
      const nodes = [createMockRectangle() as any as SceneNode];
      
      expect(() => {
        generator.generateGcode(nodes, 1000, 3000, -10); // Invalid laser power
      }).toThrow('Invalid parameters: feed rates must be positive and laser power must be non-negative.');
    });

    it('should accept zero laser power', () => {
      const nodes = [createMockRectangle() as any as SceneNode];
      
      expect(() => {
        generator.generateGcode(nodes, 1000, 3000, 0); // Zero laser power should be valid
      }).not.toThrow();
    });
  });

  describe('generateGcodeClassic', () => {
    it('should throw error when no nodes provided', () => {
      expect(() => {
        generator.generateGcodeClassic([]);
      }).toThrow('No nodes provided for G-code generation.');
    });

    it('should generate G-code for single rectangle', () => {
      const nodes = [createMockRectangle(10, 20, 50, 30, 'Test Rect') as any as SceneNode];
      
      const result = generator.generateGcodeClassic(nodes, 1000, 3000, 255);
      
      expect(result).toContain('G21 ; Set units to millimeters');
      expect(result).toContain('G90 ; Absolute positioning');
      expect(result).toContain('Processing node: Test Rect (RECTANGLE)');
      expect(result).toContain('RECTANGLE - "Test Rect"');
      expect(result).toContain('G0 X10.000 Y20.000 F3000 S0');
      expect(result).toContain('G1 X60.000 Y20.000 F1000 S255');
      expect(result).toContain('M30 ; Program end');
    });

    it('should generate G-code for multiple shapes', () => {
      const nodes = [
        createMockRectangle(0, 0, 100, 50, 'Rect1') as any as SceneNode,
        createMockEllipse(200, 100, 60, 60, 'Circle1') as any as SceneNode
      ];
      
      const result = generator.generateGcodeClassic(nodes, 800, 2500, 200);
      
      expect(result).toContain('Processing node: Rect1 (RECTANGLE)');
      expect(result).toContain('Processing node: Circle1 (ELLIPSE)');
      expect(result).toContain('RECTANGLE - "Rect1"');
      expect(result).toContain('ELLIPSE - "Circle1"');
      expect(result).toContain('F2500'); // Rapid feed rate
      expect(result).toContain('F800'); // Feed rate
      expect(result).toContain('S200'); // Laser power
    });

    it('should handle nodes without names', () => {
      const node = createMockRectangle(5, 5, 25, 25);
      delete node.name; // Remove name
      const nodes = [node as any as SceneNode];
      
      const result = generator.generateGcodeClassic(nodes);
      
      expect(result).toContain('Processing node: Unnamed (RECTANGLE)');
      expect(result).toContain('RECTANGLE');
    });

    it('should handle unsupported node types gracefully', () => {
      // Create a mock node that will fail to generate geometry
      const invalidNode = {
        type: 'UNSUPPORTED_TYPE',
        x: 0,
        y: 0,
        width: 10,
        height: 10
      } as any as SceneNode;
      
      // This should not crash, but may generate a G-code with error comments
      const result = generator.generateGcodeClassic([invalidNode]);
      expect(result).toContain('G21 ; Set units to millimeters'); // Should still have header
      expect(result).toContain('M30 ; Program end'); // Should still have footer
    });
  });
});