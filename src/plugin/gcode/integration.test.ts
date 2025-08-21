import { describe, it, expect } from 'vitest';
import { GcodeGenerator } from './gcode-generator';
import { createMockRectangle, createMockEllipse, createMockLine, DEFAULT_SETTINGS } from '../../test-utils';

/**
 * Integration tests for complete geometry-to-G-code conversion
 * These tests verify that geometries are correctly converted to valid G-code
 */
describe('Geometry to G-code Conversion Integration', () => {
  let generator: GcodeGenerator;

  beforeEach(() => {
    generator = new GcodeGenerator();
  });

  describe('Rectangle Conversion', () => {
    it('should convert a simple rectangle to correct G-code', () => {
      const rectangle = createMockRectangle(0, 0, 100, 50, 'TestRect') as any as SceneNode;
      
      const gcode = generator.generateGcodeClassic([rectangle], 1000, 3000, 255);
      
      // Verify G-code structure
      expect(gcode).toContain('G21 ; Set units to millimeters');
      expect(gcode).toContain('G90 ; Absolute positioning');
      expect(gcode).toContain('G0 F3000 S0 ; Set rapid feed rate');
      expect(gcode).toContain('G1 F1000 ; Set cutting feed rate');
      
      // Verify rectangle path (clockwise from top-left)
      expect(gcode).toContain('G0 X0.000 Y0.000 F3000 S0');     // Move to start
      expect(gcode).toContain('G1 X100.000 Y0.000 F1000 S255');  // Right edge
      expect(gcode).toContain('G1 X100.000 Y50.000 F1000 S255'); // Bottom edge
      expect(gcode).toContain('G1 X0.000 Y50.000 F1000 S255');   // Left edge
      expect(gcode).toContain('G1 X0.000 Y0.000 F1000 S255');    // Back to start
      
      // Verify end
      expect(gcode).toContain('M30 ; Program end');
    });

    it('should handle rectangle at non-zero position', () => {
      const rectangle = createMockRectangle(25, 30, 40, 20) as any as SceneNode;
      
      const gcode = generator.generateGcodeClassic([rectangle]);
      
      // Verify positioning is correct
      expect(gcode).toContain('G0 X25.000 Y30.000 F3000 S0');     // Move to start
      expect(gcode).toContain('G1 X65.000 Y30.000 F1000 S255');   // Right edge (25+40)
      expect(gcode).toContain('G1 X65.000 Y50.000 F1000 S255');   // Bottom edge (30+20)
      expect(gcode).toContain('G1 X25.000 Y50.000 F1000 S255');   // Left edge
      expect(gcode).toContain('G1 X25.000 Y30.000 F1000 S255');   // Back to start
    });
  });

  describe('Circle Conversion', () => {
    it('should convert perfect circle to arc commands', () => {
      const circle = createMockEllipse(10, 20, 60, 60, 'Circle') as any as SceneNode;
      
      const gcode = generator.generateGcodeClassic([circle]);
      
      // Verify move to start point (right edge of circle)
      // Center = (10 + 60/2, 20 + 60/2) = (40, 50)
      // Start point = center + radiusX = (40 + 30, 50) = (70, 50)
      expect(gcode).toContain('G0 X70.000 Y50.000 F3000 S0');
      
      // Verify arc command (full circle)
      expect(gcode).toContain('G3 X70.000 Y50.000 I-30.000 J0.000 F1000 S255');
    });

    it('should convert ellipse to line segments', () => {
      const ellipse = createMockEllipse(0, 0, 80, 40, 'Ellipse') as any as SceneNode;
      
      const gcode = generator.generateGcodeClassic([ellipse]);
      
      // Should contain multiple G1 commands for ellipse segments
      const g1Commands = (gcode.match(/G1/g) || []).length;
      expect(g1Commands).toBeGreaterThan(10); // Should have many segments
      
      // Should start from right edge of ellipse
      // Center = (0 + 80/2, 0 + 40/2) = (40, 20)  
      // Start point = center + radiusX = (40 + 40, 20) = (80, 20)
      expect(gcode).toContain('G0 X80.000 Y20.000 F3000 S0');
    });
  });

  describe('Line Conversion', () => {
    it('should convert horizontal line correctly', () => {
      const line = createMockLine(10, 15, 50, 0, 'HLine') as any as SceneNode;
      
      const gcode = generator.generateGcodeClassic([line]);
      
      expect(gcode).toContain('G0 X10.000 Y15.000 F3000 S0');  // Move to start
      expect(gcode).toContain('G1 X60.000 Y15.000 F1000 S255'); // Line to end (10+50, 15+0)
    });

    it('should convert diagonal line correctly', () => {
      const line = createMockLine(5, 5, 30, 40, 'DiagLine') as any as SceneNode;
      
      const gcode = generator.generateGcodeClassic([line]);
      
      expect(gcode).toContain('G0 X5.000 Y5.000 F3000 S0');    // Move to start
      expect(gcode).toContain('G1 X35.000 Y45.000 F1000 S255'); // Line to end (5+30, 5+40)
    });
  });

  describe('Multiple Shapes Conversion', () => {
    it('should convert multiple shapes in sequence', () => {
      const shapes = [
        createMockRectangle(0, 0, 50, 30, 'Rect') as any as SceneNode,
        createMockEllipse(100, 50, 40, 40, 'Circle') as any as SceneNode,
        createMockLine(200, 100, 30, 20, 'Line') as any as SceneNode
      ];
      
      const gcode = generator.generateGcodeClassic(shapes, 800, 2400, 128);
      
      // Verify all shapes are processed
      expect(gcode).toContain('Processing node: Rect (RECTANGLE)');
      expect(gcode).toContain('Processing node: Circle (ELLIPSE)');
      expect(gcode).toContain('Processing node: Line (LINE)');
      
      // Verify rectangle
      expect(gcode).toContain('G0 X0.000 Y0.000 F2400 S0');
      expect(gcode).toContain('G1 X50.000 Y0.000 F800 S128');
      
      // Verify circle (perfect circle should use arc)
      // Center = (100 + 40/2, 50 + 40/2) = (120, 70)
      // Start point = center + radiusX = (120 + 20, 70) = (140, 70)
      expect(gcode).toContain('G0 X140.000 Y70.000 F2400 S0');
      expect(gcode).toContain('G3 X140.000 Y70.000 I-20.000 J0.000 F800 S128');
      
      // Verify line
      expect(gcode).toContain('G0 X200.000 Y100.000 F2400 S0');
      expect(gcode).toContain('G1 X230.000 Y120.000 F800 S128');
    });
  });

  describe('Parameter Validation', () => {
    it('should use correct feed rates and laser power', () => {
      const rectangle = createMockRectangle(0, 0, 10, 10) as any as SceneNode;
      
      const gcode = generator.generateGcodeClassic([rectangle], 1500, 4000, 200);
      
      expect(gcode).toContain('G0 F4000 S0 ; Set rapid feed rate'); // Rapid feed rate
      expect(gcode).toContain('G1 F1500 ; Set cutting feed rate');  // Feed rate
      expect(gcode).toContain('F4000 S0'); // Rapid moves
      expect(gcode).toContain('F1500 S200'); // Cutting moves
    });

    it('should handle minimum laser power', () => {
      const rectangle = createMockRectangle(0, 0, 10, 10) as any as SceneNode;
      
      const gcode = generator.generateGcodeClassic([rectangle], 1000, 3000, 0);
      
      expect(gcode).toContain('S0'); // Zero laser power
    });

    it('should handle maximum typical laser power', () => {
      const rectangle = createMockRectangle(0, 0, 10, 10) as any as SceneNode;
      
      const gcode = generator.generateGcodeClassic([rectangle], 1000, 3000, 255);
      
      expect(gcode).toContain('S255'); // Maximum laser power
    });
  });

  describe('G-code Format Validation', () => {
    it('should generate valid G-code format', () => {
      const rectangle = createMockRectangle(10.123, 20.456, 30.789, 40.321) as any as SceneNode;
      
      const gcode = generator.generateGcodeClassic([rectangle]);
      
      // Check coordinate precision (3 decimal places)
      expect(gcode).toMatch(/X10\.123/);
      expect(gcode).toMatch(/Y20\.456/);
      expect(gcode).toMatch(/X40\.912/); // 10.123 + 30.789
      expect(gcode).toMatch(/Y60\.777/); // 20.456 + 40.321
      
      // Verify all lines end with newline
      const lines = gcode.split('\n');
      for (let i = 0; i < lines.length - 1; i++) {
        expect(lines[i]).not.toBe(''); // No empty lines except possibly the last
      }
    });

    it('should include proper comments', () => {
      const rectangle = createMockRectangle(0, 0, 50, 25, 'MyRect') as any as SceneNode;
      
      const gcode = generator.generateGcodeClassic([rectangle]);
      
      expect(gcode).toContain('; RECTANGLE - "MyRect"');
      expect(gcode).toContain('; Processing node: MyRect (RECTANGLE)');
      expect(gcode).toContain('; Set units to millimeters');
      expect(gcode).toContain('; Absolute positioning');
      expect(gcode).toContain('; Program end');
    });
  });
});