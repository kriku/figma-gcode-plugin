import { GcodeGenerator } from '../gcode-generator';
import { createMockRectangle, createMockEllipse, createMockPolygon } from './mock-nodes';

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

  interface FrameNode extends SceneNode {
    children?: SceneNode[];
  }

  interface GroupNode extends SceneNode {
    children?: SceneNode[];
  }

  interface SectionNode extends SceneNode {
    children?: SceneNode[];
  }

  // Mock figma global for testing
  var figma: {
    currentPage: {
      name: string;
    };
  };
}

// Set up mock figma global for tests
(global as any).figma = {
  currentPage: {
    name: 'Test Page'
  }
};

describe('GcodeGenerator Integration Tests', () => {
  let generator: GcodeGenerator;

  beforeEach(() => {
    generator = new GcodeGenerator();
  });

  describe('generateGcodeClassic', () => {
    it('should generate complete G-code for single rectangle', () => {
      const rectangle = createMockRectangle({
        name: 'TestRect',
        x: 10,
        y: 20,
        width: 100,
        height: 50
      });

      const result = generator.generateGcodeClassic([rectangle as any], 1000, 3000, 255);

      // Should contain setup commands
      expect(result).toContain('G21 ; Set units to millimeters');
      expect(result).toContain('G90 ; Absolute positioning');
      
      // Should contain shape generation
      expect(result).toContain('; RECTANGLE - "TestRect"');
      expect(result).toContain('G0 X10.000 Y20.000 F3000 S0');
      expect(result).toContain('G1 X110.000 Y20.000 F1000 S255');
      
      // Should contain end command
      expect(result).toContain('M30 ; Program end');
    });

    it('should generate complete G-code for multiple shapes', () => {
      const rectangle = createMockRectangle({
        name: 'Rect1',
        x: 0,
        y: 0,
        width: 50,
        height: 30
      });
      
      const ellipse = createMockEllipse({
        name: 'Circle1',
        x: 60,
        y: 40,
        width: 40,
        height: 40
      });

      const nodes = [rectangle as any, ellipse as any];
      const result = generator.generateGcodeClassic(nodes, 800, 2500, 200);

      // Should contain setup
      expect(result).toContain('G21 ; Set units to millimeters');
      expect(result).toContain('G0 F2500 S0');
      expect(result).toContain('G1 F800');
      
      // Should contain both shapes
      expect(result).toContain('; RECTANGLE - "Rect1"');
      expect(result).toContain('; ELLIPSE - "Circle1"');
      
      // Rectangle commands
      expect(result).toContain('G0 X0.000 Y0.000 F2500 S0');
      expect(result).toContain('G1 X50.000 Y0.000 F800 S200');
      
      // Circle commands (perfect circle should use arc)
      expect(result).toContain('G0 X100.000 Y60.000 F2500 S0');
      expect(result).toContain('G3 X100.000 Y60.000 I-20.000 J0.000 F800 S200');
      
      // Should end properly
      expect(result).toContain('M30 ; Program end');
    });

    it('should handle empty node array', () => {
      expect(() => {
        generator.generateGcodeClassic([], 1000, 3000, 255);
      }).toThrow('No nodes provided for G-code generation.');
    });

    it('should validate feed rate parameters', () => {
      const rectangle = createMockRectangle();
      
      expect(() => {
        generator.generateGcodeClassic([rectangle as any], 0, 3000, 255);
      }).toThrow('Invalid parameters: feed rates must be positive and laser power must be non-negative.');
      
      expect(() => {
        generator.generateGcodeClassic([rectangle as any], 1000, -100, 255);
      }).toThrow('Invalid parameters: feed rates must be positive and laser power must be non-negative.');
    });

    it('should validate laser power parameter', () => {
      const rectangle = createMockRectangle();
      
      expect(() => {
        generator.generateGcodeClassic([rectangle as any], 1000, 3000, -10);
      }).toThrow('Invalid parameters: feed rates must be positive and laser power must be non-negative.');
    });

    it('should handle zero laser power', () => {
      const rectangle = createMockRectangle({
        width: 20,
        height: 20
      });

      const result = generator.generateGcodeClassic([rectangle as any], 1000, 3000, 0);

      expect(result).toContain('G1 X20.000 Y0.000 F1000 S0');
      expect(result).toBeTruthy(); // Should generate without throwing
    });
  });

  describe('geometry accuracy tests', () => {
    it('should generate accurate rectangle coordinates', () => {
      const rectangle = createMockRectangle({
        x: 25.5,
        y: 30.75,
        width: 45.25,
        height: 35.5
      });

      const result = generator.generateGcodeClassic([rectangle as any]);

      // Check precise coordinates
      expect(result).toContain('G0 X25.500 Y30.750 F3000 S0');
      expect(result).toContain('G1 X70.750 Y30.750 F1000 S255'); // 25.5 + 45.25
      expect(result).toContain('G1 X70.750 Y66.250 F1000 S255'); // 30.75 + 35.5
      expect(result).toContain('G1 X25.500 Y66.250 F1000 S255');
      expect(result).toContain('G1 X25.500 Y30.750 F1000 S255');
    });

    it('should generate accurate circle with arc commands', () => {
      const circle = createMockEllipse({
        x: 10,
        y: 20,
        width: 60,
        height: 60 // Perfect circle
      });

      const result = generator.generateGcodeClassic([circle as any]);

      // Center at (10 + 30, 20 + 30) = (40, 50)
      // Start at rightmost point: (70, 50)
      expect(result).toContain('G0 X70.000 Y50.000 F3000 S0');
      // Arc with center offset (-30, 0)
      expect(result).toContain('G3 X70.000 Y50.000 I-30.000 J0.000 F1000 S255');
    });

    it('should generate accurate polygon vertices', () => {
      const triangle = createMockPolygon({
        x: 0,
        y: 0,
        width: 30,
        height: 30,
        pointCount: 3
      });

      const result = generator.generateGcodeClassic([triangle as any]);

      // Triangle centered at (15, 15) with radius 15
      // First vertex at top: (15, 0)
      expect(result).toContain('G0 X15.000 Y0.000 F3000 S0');
      
      // Should have exactly 3 line commands for triangle  
      // Note: Triangle is closed, so it will have 4 line commands (returning to start)
      const lineCommands = (result.match(/G1/g) || []).length;
      expect(lineCommands).toBe(4);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle very small shapes', () => {
      const tinyRect = createMockRectangle({
        width: 0.001,
        height: 0.001
      });

      const result = generator.generateGcodeClassic([tinyRect as any]);

      expect(result).toContain('G0 X0.000 Y0.000 F3000 S0');
      expect(result).toContain('G1 X0.001 Y0.000 F1000 S255');
      expect(result).toBeTruthy(); // Should generate without throwing
    });

    it('should handle very large shapes', () => {
      const largeRect = createMockRectangle({
        width: 10000,
        height: 5000
      });

      const result = generator.generateGcodeClassic([largeRect as any]);

      expect(result).toContain('G1 X10000.000 Y0.000 F1000 S255');
      expect(result).toBeTruthy(); // Should generate without throwing
    });

    it('should handle negative coordinates', () => {
      const negativeRect = createMockRectangle({
        x: -50,
        y: -30,
        width: 25,
        height: 15
      });

      const result = generator.generateGcodeClassic([negativeRect as any]);

      expect(result).toContain('G0 X-50.000 Y-30.000 F3000 S0');
      expect(result).toContain('G1 X-25.000 Y-30.000 F1000 S255');
      expect(result).toBeTruthy(); // Should generate without throwing
    });

    it('should handle zero-dimension shapes', () => {
      const zeroWidthRect = createMockRectangle({
        width: 0,
        height: 50
      });

      const result = generator.generateGcodeClassic([zeroWidthRect as any]);

      // Should still generate commands (resulting in vertical line)
      expect(result).toContain('G0 X0.000 Y0.000 F3000 S0');
      expect(result).toContain('G1 X0.000 Y0.000 F1000 S255');
      expect(result).toBeTruthy(); // Should generate without throwing
    });
  });

  describe('G-code format compliance', () => {
    it('should generate valid G-code format', () => {
      const rectangle = createMockRectangle();
      const result = generator.generateGcodeClassic([rectangle as any]);

      // Check G-code format standards
      const lines = result.split('\n').filter(line => line.trim().length > 0);
      
      lines.forEach(line => {
        // Each line should either be a command or comment
        expect(line).toMatch(/^(G\d+|M\d+|;)/);
        
        // Commands should have proper parameter format
        if (line.startsWith('G') || line.startsWith('M')) {
          // Should not have malformed parameters
          expect(line).not.toMatch(/[XYZ]\s+/); // No space after axis letter
          expect(line).not.toMatch(/F\s+/);     // No space after F
          expect(line).not.toMatch(/S\s+/);     // No space after S
        }
      });
    });

    it('should use consistent coordinate precision', () => {
      const rectangle = createMockRectangle({
        x: 1.2345,
        y: 6.7890,
        width: 12.3456,
        height: 9.8765
      });

      const result = generator.generateGcodeClassic([rectangle as any]);

      // All coordinates should be formatted to 3 decimal places
      expect(result).toContain('X1.234');    // Coordinate precision check
      expect(result).toContain('Y6.789');
      expect(result).toContain('X13.580');   // 1.2345 + 12.3456 rounded
      expect(result).toContain('Y16.666');   // 6.7890 + 9.8765 rounded
    });

    it('should generate proper program structure', () => {
      const shapes = [
        createMockRectangle({ name: 'Rect1' }),
        createMockEllipse({ name: 'Circle1' })
      ];

      const result = generator.generateGcodeClassic(shapes as any);
      const lines = result.split('\n').filter(line => line.trim().length > 0);

      // Should start with setup commands (after header comments)
      const setupLineIndex = lines.findIndex(line => line.includes('G21'));
      expect(setupLineIndex).toBeGreaterThan(-1);
      expect(lines[setupLineIndex]).toContain('G21'); // Units
      expect(lines[setupLineIndex + 1]).toContain('G90'); // Positioning mode
      
      // Should end with program end
      const lastLine = lines[lines.length - 1];
      expect(lastLine).toContain('M30');
    });
  });

  describe('performance and optimization', () => {
    it('should handle large number of shapes efficiently', () => {
      const shapes = [];
      for (let i = 0; i < 100; i++) {
        shapes.push(createMockRectangle({
          name: `Rect${i}`,
          x: i * 10,
          y: i * 5,
          width: 5,
          height: 5
        }) as any);
      }

      const startTime = Date.now();
      const result = generator.generateGcodeClassic(shapes);
      const endTime = Date.now();

      // Should complete in reasonable time (under 1 second for 100 shapes)
      expect(endTime - startTime).toBeLessThan(1000);
      
      // Should contain all shapes
      expect(result).toContain('Rect0');
      expect(result).toContain('Rect99');
      
      // Should have proper structure
      expect(result).toContain('G21'); // Setup
      expect(result).toContain('M30'); // End
    });
  });
});