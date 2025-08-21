import { describe, it, expect } from 'vitest';
import { MoveCommand, LineCommand, ArcCommand, LaserControlCommand, CommentCommand, SetupCommand, EndProgramCommand } from './commands';
import { Point } from './types';

describe('G-code Commands', () => {
  describe('MoveCommand', () => {
    it('should generate correct G0 move command without feed rate', () => {
      const point: Point = { x: 10.5, y: 20.25 };
      const command = new MoveCommand(point);
      
      expect(command.execute()).toBe('G0 X10.500 Y20.250 S0\n');
    });

    it('should generate correct G0 move command with feed rate', () => {
      const point: Point = { x: 15.123, y: 25.789 };
      const command = new MoveCommand(point, 3000);
      
      expect(command.execute()).toBe('G0 X15.123 Y25.789 F3000 S0\n');
    });

    it('should handle zero coordinates', () => {
      const point: Point = { x: 0, y: 0 };
      const command = new MoveCommand(point, 2000);
      
      expect(command.execute()).toBe('G0 X0.000 Y0.000 F2000 S0\n');
    });
  });

  describe('LineCommand', () => {
    it('should generate correct G1 line command without parameters', () => {
      const point: Point = { x: 30.5, y: 40.25 };
      const command = new LineCommand(point);
      
      expect(command.execute()).toBe('G1 X30.500 Y40.250\n');
    });

    it('should generate correct G1 line command with laser power', () => {
      const point: Point = { x: 50.1, y: 60.9 };
      const command = new LineCommand(point, 255);
      
      expect(command.execute()).toBe('G1 X50.100 Y60.900 S255\n');
    });

    it('should generate correct G1 line command with feed rate', () => {
      const point: Point = { x: 70.3, y: 80.7 };
      const command = new LineCommand(point, undefined, 1000);
      
      expect(command.execute()).toBe('G1 X70.300 Y80.700 F1000\n');
    });

    it('should generate correct G1 line command with all parameters', () => {
      const point: Point = { x: 90.2, y: 100.8 };
      const command = new LineCommand(point, 128, 1500);
      
      expect(command.execute()).toBe('G1 X90.200 Y100.800 F1500 S128\n');
    });
  });

  describe('ArcCommand', () => {
    it('should generate correct G3 counter-clockwise arc command', () => {
      const endPoint: Point = { x: 20, y: 20 };
      const centerOffset: Point = { x: 10, y: 0 };
      const command = new ArcCommand(endPoint, centerOffset, false);
      
      expect(command.execute()).toBe('G3 X20.000 Y20.000 I10.000 J0.000\n');
    });

    it('should generate correct G2 clockwise arc command', () => {
      const endPoint: Point = { x: 30, y: 30 };
      const centerOffset: Point = { x: 15, y: 15 };
      const command = new ArcCommand(endPoint, centerOffset, true);
      
      expect(command.execute()).toBe('G2 X30.000 Y30.000 I15.000 J15.000\n');
    });

    it('should generate arc command with laser power and feed rate', () => {
      const endPoint: Point = { x: 40, y: 40 };
      const centerOffset: Point = { x: 20, y: 0 };
      const command = new ArcCommand(endPoint, centerOffset, false, 200, 800);
      
      expect(command.execute()).toBe('G3 X40.000 Y40.000 I20.000 J0.000 F800 S200\n');
    });
  });

  describe('LaserControlCommand', () => {
    it('should generate laser on command with inline mode', () => {
      const command = new LaserControlCommand(true, true);
      
      expect(command.execute()).toBe('M3 I ; Enable laser inline mode\n');
    });

    it('should generate laser off command with inline mode', () => {
      const command = new LaserControlCommand(false, true);
      
      expect(command.execute()).toBe('M5 I ; Disable laser inline mode\n');
    });

    it('should generate laser on command without inline mode', () => {
      const command = new LaserControlCommand(true, false);
      
      expect(command.execute()).toBe('M3 ; Enable laser\n');
    });

    it('should generate laser off command without inline mode', () => {
      const command = new LaserControlCommand(false, false);
      
      expect(command.execute()).toBe('M5 ; Disable laser\n');
    });
  });

  describe('CommentCommand', () => {
    it('should generate correct comment', () => {
      const command = new CommentCommand('This is a test comment');
      
      expect(command.execute()).toBe('; This is a test comment\n');
    });

    it('should handle empty comment', () => {
      const command = new CommentCommand('');
      
      expect(command.execute()).toBe('; \n');
    });
  });

  describe('SetupCommand', () => {
    it('should generate correct setup commands', () => {
      const command = new SetupCommand(1000, 3000, 255);
      
      const expected = 'G21 ; Set units to millimeters\n' +
                      'G90 ; Absolute positioning\n' +
                      'G0 F3000 S0 ; Set rapid feed rate and ensure laser is off\n' +
                      'G1 F1000 ; Set cutting feed rate\n';
      
      expect(command.execute()).toBe(expected);
    });
  });

  describe('EndProgramCommand', () => {
    it('should generate correct program end command', () => {
      const command = new EndProgramCommand();
      
      expect(command.execute()).toBe('M30 ; Program end\n');
    });
  });
});