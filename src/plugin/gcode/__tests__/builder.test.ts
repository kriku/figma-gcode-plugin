import { GcodeBuilderImpl } from '../builder';
import { MoveCommand, LineCommand, CommentCommand } from '../commands';
import { Point } from '../types';

describe('GcodeBuilderImpl', () => {
  let builder: GcodeBuilderImpl;

  beforeEach(() => {
    builder = new GcodeBuilderImpl();
  });

  describe('addCommand', () => {
    it('should add commands and return builder for chaining', () => {
      const point: Point = { x: 10, y: 20 };
      const moveCommand = new MoveCommand(point);
      const lineCommand = new LineCommand(point);

      const result = builder
        .addCommand(moveCommand)
        .addCommand(lineCommand);

      expect(result).toBe(builder);
    });

    it('should accumulate multiple commands', () => {
      const point1: Point = { x: 0, y: 0 };
      const point2: Point = { x: 10, y: 10 };
      
      builder
        .addCommand(new MoveCommand(point1))
        .addCommand(new LineCommand(point2));

      const result = builder.build();
      expect(result).toContain('G0 X0.000 Y0.000 S0');
      expect(result).toContain('G1 X10.000 Y10.000');
    });
  });

  describe('addComment', () => {
    it('should add comment and return builder for chaining', () => {
      const result = builder.addComment('Test comment');
      
      expect(result).toBe(builder);
    });

    it('should generate proper comment format', () => {
      builder.addComment('Starting rectangle generation');
      const result = builder.build();
      
      expect(result).toBe('; Starting rectangle generation\n');
    });

    it('should handle multiple comments', () => {
      builder
        .addComment('First comment')
        .addComment('Second comment');

      const result = builder.build();
      expect(result).toContain('; First comment\n');
      expect(result).toContain('; Second comment\n');
    });
  });

  describe('build', () => {
    it('should return empty string when no commands added', () => {
      const result = builder.build();
      
      expect(result).toBe('');
    });

    it('should build commands in correct order', () => {
      const point1: Point = { x: 0, y: 0 };
      const point2: Point = { x: 10, y: 10 };
      const point3: Point = { x: 20, y: 20 };

      builder
        .addComment('Start')
        .addCommand(new MoveCommand(point1))
        .addComment('Move to next point')
        .addCommand(new LineCommand(point2))
        .addCommand(new LineCommand(point3))
        .addComment('End');

      const result = builder.build();
      const lines = result.split('\n').filter(line => line.length > 0);

      expect(lines[0]).toBe('; Start');
      expect(lines[1]).toBe('G0 X0.000 Y0.000 S0');
      expect(lines[2]).toBe('; Move to next point');
      expect(lines[3]).toBe('G1 X10.000 Y10.000');
      expect(lines[4]).toBe('G1 X20.000 Y20.000');
      expect(lines[5]).toBe('; End');
    });

    it('should handle mixed commands and comments', () => {
      const point: Point = { x: 5, y: 15 };
      
      builder
        .addComment('Rectangle generation')
        .addCommand(new MoveCommand(point, 3000))
        .addCommand(new LineCommand({ x: 15, y: 15 }, 255, 1000));

      const result = builder.build();
      
      expect(result).toContain('; Rectangle generation\n');
      expect(result).toContain('G0 X5.000 Y15.000 F3000 S0\n');
      expect(result).toContain('G1 X15.000 Y15.000 F1000 S255\n');
    });
  });

  describe('reset', () => {
    it('should clear all commands and return builder for chaining', () => {
      const point: Point = { x: 10, y: 20 };
      
      builder
        .addComment('Test')
        .addCommand(new MoveCommand(point));

      expect(builder.build()).not.toBe('');

      const result = builder.reset();
      
      expect(result).toBe(builder);
      expect(builder.build()).toBe('');
    });

    it('should allow reuse after reset', () => {
      const point1: Point = { x: 0, y: 0 };
      const point2: Point = { x: 10, y: 10 };

      // First build
      builder.addCommand(new MoveCommand(point1));
      const firstResult = builder.build();

      // Reset and build again
      builder
        .reset()
        .addCommand(new LineCommand(point2));
      const secondResult = builder.build();

      expect(firstResult).toContain('G0 X0.000 Y0.000 S0');
      expect(secondResult).toContain('G1 X10.000 Y10.000');
      expect(secondResult).not.toContain('G0');
    });
  });

  describe('fluent interface', () => {
    it('should support method chaining for complex sequences', () => {
      const result = builder
        .addComment('Complex shape')
        .addCommand(new MoveCommand({ x: 0, y: 0 }, 3000))
        .addCommand(new LineCommand({ x: 10, y: 0 }, 255, 1000))
        .addCommand(new LineCommand({ x: 10, y: 10 }, 255, 1000))
        .addComment('Shape complete')
        .build();

      const lines = result.split('\n').filter(line => line.length > 0);
      expect(lines).toHaveLength(5);
      expect(lines[0]).toBe('; Complex shape');
      expect(lines[1]).toBe('G0 X0.000 Y0.000 F3000 S0');
      expect(lines[2]).toBe('G1 X10.000 Y0.000 F1000 S255');
      expect(lines[3]).toBe('G1 X10.000 Y10.000 F1000 S255');
      expect(lines[4]).toBe('; Shape complete');
    });
  });
});