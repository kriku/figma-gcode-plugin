import { Point, GcodeSettings, GcodeBuilder } from "../types";
import { MoveCommand, LineCommand } from "../commands";

export class VectorPathProcessor {
  constructor(private builder: GcodeBuilder) {}

  processVectorNetwork(
    vectorNetwork: VectorNetwork,
    offsetPoint: Point,
    settings: GcodeSettings
  ): string {
    const { vertices, segments } = vectorNetwork;
    const paths = this.groupSegmentsIntoPaths([...segments]);

    this.builder.reset();

    for (const path of paths) {
      let isFirstPoint = true;

      for (const segmentIndex of path) {
        const segment = segments[segmentIndex];
        const startVertex = vertices[segment.start];
        const endVertex = vertices[segment.end];

        // Convert relative coordinates to absolute
        const startX = offsetPoint.x + startVertex.x;
        const startY = offsetPoint.y + startVertex.y;
        const endX = offsetPoint.x + endVertex.x;
        const endY = offsetPoint.y + endVertex.y;

        if (isFirstPoint) {
          this.builder.addCommand(
            new MoveCommand({ x: startX, y: startY }, settings.rapidFeedRate)
          );
          isFirstPoint = false;
        }

        if (this.hasCurvedSegment(segment)) {
          // Handle curved segments (Bezier curves)
          this.processBezierCurve(
            { x: startX, y: startY },
            { x: endX, y: endY },
            segment.tangentStart,
            segment.tangentEnd,
            offsetPoint,
            settings
          );
        } else {
          // Straight line segment
          this.builder.addCommand(
            new LineCommand(
              { x: endX, y: endY },
              settings.laserPower,
              settings.feedRate
            )
          );
        }
      }
    }

    return this.builder.build();
  }

  processVectorPaths(
    vectorPaths: VectorPath[],
    offsetPoint: Point,
    settings: GcodeSettings
  ): string {
    this.builder.reset();

    for (const path of vectorPaths) {
      if (path.data) {
        this.processSVGPath(path.data, offsetPoint, settings);
      }
    }

    return this.builder.build();
  }

  private hasCurvedSegment(segment: VectorSegment): boolean {
    return !!(
      segment.tangentStart?.x ||
      segment.tangentStart?.y ||
      segment.tangentEnd?.x ||
      segment.tangentEnd?.y
    );
  }

  private processBezierCurve(
    startPoint: Point,
    endPoint: Point,
    tangentStart: VectorVertex | undefined,
    tangentEnd: VectorVertex | undefined,
    offsetPoint: Point,
    settings: GcodeSettings
  ): void {
    if (!tangentStart && !tangentEnd) {
      // No tangents, just a straight line
      this.builder.addCommand(
        new LineCommand(endPoint, settings.laserPower, settings.feedRate)
      );
      return;
    }

    // Convert tangent points to control points
    const cp1x = tangentStart ? startPoint.x + tangentStart.x : startPoint.x;
    const cp1y = tangentStart ? startPoint.y + tangentStart.y : startPoint.y;
    const cp2x = tangentEnd ? endPoint.x + tangentEnd.x : endPoint.x;
    const cp2y = tangentEnd ? endPoint.y + tangentEnd.y : endPoint.y;

    this.approximateBezierCurve(
      startPoint,
      { x: cp1x, y: cp1y },
      { x: cp2x, y: cp2y },
      endPoint,
      settings
    );
  }

  private approximateBezierCurve(
    p0: Point,
    p1: Point,
    p2: Point,
    p3: Point,
    settings: GcodeSettings,
    segments: number = 16
  ): void {
    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const oneMinusT = 1 - t;

      // Cubic Bezier formula
      const x =
        oneMinusT ** 3 * p0.x +
        3 * oneMinusT ** 2 * t * p1.x +
        3 * oneMinusT * t ** 2 * p2.x +
        t ** 3 * p3.x;

      const y =
        oneMinusT ** 3 * p0.y +
        3 * oneMinusT ** 2 * t * p1.y +
        3 * oneMinusT * t ** 2 * p2.y +
        t ** 3 * p3.y;

      this.builder.addCommand(
        new LineCommand({ x, y }, settings.laserPower, settings.feedRate)
      );
    }
  }

  private groupSegmentsIntoPaths(segments: VectorSegment[]): number[][] {
    const paths: number[][] = [];
    const used = new Set<number>();

    for (let i = 0; i < segments.length; i++) {
      if (used.has(i)) continue;

      const path: number[] = [i];
      used.add(i);

      // Try to find connected segments
      let currentEnd = segments[i].end;
      let foundConnection = true;

      while (foundConnection) {
        foundConnection = false;
        for (let j = 0; j < segments.length; j++) {
          if (used.has(j)) continue;

          if (segments[j].start === currentEnd) {
            path.push(j);
            used.add(j);
            currentEnd = segments[j].end;
            foundConnection = true;
            break;
          }
        }
      }

      paths.push(path);
    }

    return paths;
  }

  private processSVGPath(
    pathData: string,
    offsetPoint: Point,
    settings: GcodeSettings
  ): void {
    // Simple SVG path parser - handles basic commands
    const commands =
      pathData.match(/[MmLlHhVvCcSsQqTtAaZz][^MmLlHhVvCcSsQqTtAaZz]*/g) || [];

    let currentX = 0;
    let currentY = 0;
    let startX = 0;
    let startY = 0;

    for (const command of commands) {
      const type = command[0];
      const params = command
        .slice(1)
        .trim()
        .split(/[\s,]+/)
        .map(Number)
        .filter((n) => !isNaN(n));

      switch (type.toLowerCase()) {
        case "m": // Move to
          if (params.length >= 2) {
            if (type === "M") {
              // Absolute move
              currentX = params[0];
              currentY = params[1];
            } else {
              // Relative move
              currentX += params[0];
              currentY += params[1];
            }
            startX = currentX;
            startY = currentY;
            this.builder.addCommand(
              new MoveCommand(
                { x: offsetPoint.x + currentX, y: offsetPoint.y + currentY },
                settings.rapidFeedRate
              )
            );
          }
          break;

        case "l": // Line to
          for (let i = 0; i < params.length; i += 2) {
            if (i + 1 < params.length) {
              if (type === "L") {
                // Absolute line
                currentX = params[i];
                currentY = params[i + 1];
              } else {
                // Relative line
                currentX += params[i];
                currentY += params[i + 1];
              }
              this.builder.addCommand(
                new LineCommand(
                  { x: offsetPoint.x + currentX, y: offsetPoint.y + currentY },
                  settings.laserPower,
                  settings.feedRate
                )
              );
            }
          }
          break;

        case "z": // Close path
          this.builder.addCommand(
            new LineCommand(
              { x: offsetPoint.x + startX, y: offsetPoint.y + startY },
              settings.laserPower,
              settings.feedRate
            )
          );
          currentX = startX;
          currentY = startY;
          break;
      }
    }
  }
}
