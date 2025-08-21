import { describe, it, expect, beforeEach } from 'vitest';
import { GcodeBuilderImpl } from './builder';
import { MoveCommand, LineCommand, CommentCommand } from './commands';
import { Point } from './types';

describe('GcodeBuilder', () => {
  let builder: GcodeBuilderImpl;

  beforeEach(() => {
    builder = new GcodeBuilderImpl();
  });

  describe('addCommand', () => {
    it('should add commands and build G-code', () => {
      const point1: Point = { x: 10, y: 20 };
      const point2: Point = { x: 30, y: 40 };

      const result = builder
        .addCommand(new MoveCommand(point1, 3000))
        .addCommand(new LineCommand(point2, 255, 1000))
        .build();

      expect(result).toBe(
        'G0 X10.000 Y20.000 F3000 S0\n' +
        'G1 X30.000 Y40.000 F1000 S255\n'
      );
    });

    it('should return the builder for method chaining', () => {
      const point: Point = { x: 0, y: 0 };
      const result = builder.addCommand(new MoveCommand(point));
      
      expect(result).toBe(builder);
    });
  });

  describe('addComment', () => {
    it('should add comments correctly', () => {
      const result = builder
        .addComment('Starting rectangle')
        .addComment('Moving to start position')
        .build();

      expect(result).toBe(
        '; Starting rectangle\n' +
        '; Moving to start position\n'
      );
    });

    it('should return the builder for method chaining', () => {
      const result = builder.addComment('Test comment');
      
      expect(result).toBe(builder);
    });
  });

  describe('build', () => {
    it('should return empty string for empty builder', () => {
      expect(builder.build()).toBe('');
    });

    it('should build mixed commands and comments', () => {
      const point: Point = { x: 15.5, y: 25.75 };

      const result = builder
        .addComment('Test shape')
        .addCommand(new MoveCommand(point, 2000))
        .addComment('End shape')
        .build();

      expect(result).toBe(
        '; Test shape\n' +
        'G0 X15.500 Y25.750 F2000 S0\n' +
        '; End shape\n'
      );
    });
  });

  describe('reset', () => {
    it('should clear all commands', () => {
      const point: Point = { x: 5, y: 10 };
      
      builder
        .addComment('Test')
        .addCommand(new MoveCommand(point))
        .reset();

      expect(builder.build()).toBe('');
    });

    it('should return the builder for method chaining', () => {
      const result = builder.reset();
      
      expect(result).toBe(builder);
    });

    it('should allow adding new commands after reset', () => {
      const point1: Point = { x: 1, y: 2 };
      const point2: Point = { x: 3, y: 4 };

      // Add some commands and reset
      builder
        .addCommand(new MoveCommand(point1))
        .reset();

      // Add new commands
      const result = builder
        .addComment('After reset')
        .addCommand(new MoveCommand(point2, 1500))
        .build();

      expect(result).toBe(
        '; After reset\n' +
        'G0 X3.000 Y4.000 F1500 S0\n'
      );
    });
  });
});