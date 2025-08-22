import {
  MoveCommand,
  LineCommand,
  ArcCommand,
  LaserControlCommand,
  CommentCommand,
  SetupCommand,
  EndProgramCommand
} from '../commands';
import { Point } from '../types';

describe('G-code Commands', () => {
  describe('MoveCommand', () => {
    it('should generate G0 command with coordinates', () => {
      const point: Point = { x: 10.5, y: 20.75 };
      const command = new MoveCommand(point);
      
      expect(command.execute()).toBe('G0 X10.500 Y20.750 S0\n');
    });

    it('should include feed rate when provided', () => {
      const point: Point = { x: 5, y: 15 };
      const rapidFeedRate = 3000;
      const command = new MoveCommand(point, rapidFeedRate);
      
      expect(command.execute()).toBe('G0 X5.000 Y15.000 F3000 S0\n');
    });

    it('should handle zero coordinates', () => {
      const point: Point = { x: 0, y: 0 };
      const command = new MoveCommand(point);
      
      expect(command.execute()).toBe('G0 X0.000 Y0.000 S0\n');
    });

    it('should handle negative coordinates', () => {
      const point: Point = { x: -10.5, y: -5.25 };
      const command = new MoveCommand(point);
      
      expect(command.execute()).toBe('G0 X-10.500 Y-5.250 S0\n');
    });
  });

  describe('LineCommand', () => {
    it('should generate G1 command with coordinates', () => {
      const point: Point = { x: 30.125, y: 40.875 };
      const command = new LineCommand(point);
      
      expect(command.execute()).toBe('G1 X30.125 Y40.875\n');
    });

    it('should include laser power when provided', () => {
      const point: Point = { x: 25, y: 35 };
      const laserPower = 255;
      const command = new LineCommand(point, laserPower);
      
      expect(command.execute()).toBe('G1 X25.000 Y35.000 S255\n');
    });

    it('should include feed rate when provided', () => {
      const point: Point = { x: 15, y: 25 };
      const laserPower = 128;
      const feedRate = 1000;
      const command = new LineCommand(point, laserPower, feedRate);
      
      expect(command.execute()).toBe('G1 X15.000 Y25.000 F1000 S128\n');
    });

    it('should handle zero laser power', () => {
      const point: Point = { x: 10, y: 20 };
      const laserPower = 0;
      const command = new LineCommand(point, laserPower);
      
      expect(command.execute()).toBe('G1 X10.000 Y20.000 S0\n');
    });
  });

  describe('ArcCommand', () => {
    it('should generate G3 command for counter-clockwise arc', () => {
      const endPoint: Point = { x: 10, y: 20 };
      const centerOffset: Point = { x: 5, y: 0 };
      const command = new ArcCommand(endPoint, centerOffset, false);
      
      expect(command.execute()).toBe('G3 X10.000 Y20.000 I5.000 J0.000\n');
    });

    it('should generate G2 command for clockwise arc', () => {
      const endPoint: Point = { x: 10, y: 20 };
      const centerOffset: Point = { x: 5, y: 0 };
      const command = new ArcCommand(endPoint, centerOffset, true);
      
      expect(command.execute()).toBe('G2 X10.000 Y20.000 I5.000 J0.000\n');
    });

    it('should include laser power and feed rate when provided', () => {
      const endPoint: Point = { x: 15, y: 25 };
      const centerOffset: Point = { x: -7.5, y: 2.5 };
      const laserPower = 200;
      const feedRate = 800;
      const command = new ArcCommand(endPoint, centerOffset, false, laserPower, feedRate);
      
      expect(command.execute()).toBe('G3 X15.000 Y25.000 I-7.500 J2.500 F800 S200\n');
    });

    it('should handle negative center offsets', () => {
      const endPoint: Point = { x: 0, y: 0 };
      const centerOffset: Point = { x: -10, y: -5 };
      const command = new ArcCommand(endPoint, centerOffset, true);
      
      expect(command.execute()).toBe('G2 X0.000 Y0.000 I-10.000 J-5.000\n');
    });
  });

  describe('LaserControlCommand', () => {
    it('should generate M3 I command for enabling inline mode', () => {
      const command = new LaserControlCommand(true, true);
      
      expect(command.execute()).toBe('M3 I ; Enable laser inline mode\n');
    });

    it('should generate M3 command for enabling laser', () => {
      const command = new LaserControlCommand(true, false);
      
      expect(command.execute()).toBe('M3 ; Enable laser\n');
    });

    it('should generate M5 I command for disabling inline mode', () => {
      const command = new LaserControlCommand(false, true);
      
      expect(command.execute()).toBe('M5 I ; Disable laser inline mode\n');
    });

    it('should generate M5 command for disabling laser', () => {
      const command = new LaserControlCommand(false, false);
      
      expect(command.execute()).toBe('M5 ; Disable laser\n');
    });

    it('should default to inline mode when not specified', () => {
      const enableCommand = new LaserControlCommand(true);
      const disableCommand = new LaserControlCommand(false);
      
      expect(enableCommand.execute()).toBe('M3 I ; Enable laser inline mode\n');
      expect(disableCommand.execute()).toBe('M5 I ; Disable laser inline mode\n');
    });
  });

  describe('CommentCommand', () => {
    it('should generate comment with proper format', () => {
      const command = new CommentCommand('This is a test comment');
      
      expect(command.execute()).toBe('; This is a test comment\n');
    });

    it('should handle empty comment', () => {
      const command = new CommentCommand('');
      
      expect(command.execute()).toBe('; \n');
    });

    it('should handle special characters in comment', () => {
      const command = new CommentCommand('Shape: "Rectangle #1" - 100x50mm');
      
      expect(command.execute()).toBe('; Shape: "Rectangle #1" - 100x50mm\n');
    });
  });

  describe('SetupCommand', () => {
    it('should generate proper setup sequence', () => {
      const command = new SetupCommand(1000, 3000, 255);
      const result = command.execute();
      
      expect(result).toContain('G21 ; Set units to millimeters');
      expect(result).toContain('G90 ; Absolute positioning');
      expect(result).toContain('G0 F3000 S0 ; Set rapid feed rate and ensure laser is off');
      expect(result).toContain('G1 F1000 ; Set cutting feed rate');
    });

    it('should handle different feed rate values', () => {
      const command = new SetupCommand(500, 2000, 128);
      const result = command.execute();
      
      expect(result).toContain('G0 F2000 S0');
      expect(result).toContain('G1 F500');
    });
  });

  describe('EndProgramCommand', () => {
    it('should generate M30 program end command', () => {
      const command = new EndProgramCommand();
      
      expect(command.execute()).toBe('M30 ; Program end\n');
    });
  });
});