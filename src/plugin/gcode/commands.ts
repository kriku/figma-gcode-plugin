import { GcodeCommand, Point } from "./types";

// Command implementations for different G-code operations
export class MoveCommand implements GcodeCommand {
  constructor(private point: Point, private rapidFeedRate?: number) {}

  execute(): string {
    const feedParam = this.rapidFeedRate ? ` F${this.rapidFeedRate}` : "";
    return `G0 X${this.point.x.toFixed(3)} Y${this.point.y.toFixed(
      3
    )}${feedParam} S0\n`;
  }
}

export class LineCommand implements GcodeCommand {
  constructor(
    private point: Point,
    private laserPower?: number,
    private feedRate?: number
  ) {}

  execute(): string {
    const sParam = this.laserPower !== undefined ? ` S${this.laserPower}` : "";
    const feedParam = this.feedRate ? ` F${this.feedRate}` : "";
    return `G1 X${this.point.x.toFixed(3)} Y${this.point.y.toFixed(
      3
    )}${feedParam}${sParam}\n`;
  }
}

export class ArcCommand implements GcodeCommand {
  constructor(
    private endPoint: Point,
    private centerOffset: Point,
    private clockwise: boolean = false,
    private laserPower?: number,
    private feedRate?: number
  ) {}

  execute(): string {
    const direction = this.clockwise ? "G2" : "G3";
    const sParam = this.laserPower !== undefined ? ` S${this.laserPower}` : "";
    const feedParam = this.feedRate ? ` F${this.feedRate}` : "";
    return `${direction} X${this.endPoint.x.toFixed(
      3
    )} Y${this.endPoint.y.toFixed(3)} I${this.centerOffset.x.toFixed(
      3
    )} J${this.centerOffset.y.toFixed(3)}${feedParam}${sParam}\n`;
  }
}

export class LaserControlCommand implements GcodeCommand {
  constructor(private enable: boolean, private inline: boolean = true) {}

  execute(): string {
    if (this.enable) {
      return this.inline
        ? "M3 I ; Enable laser inline mode\n"
        : "M3 ; Enable laser\n";
    } else {
      return this.inline
        ? "M5 I ; Disable laser inline mode\n"
        : "M5 ; Disable laser\n";
    }
  }
}

export class CommentCommand implements GcodeCommand {
  constructor(private comment: string) {}

  execute(): string {
    return `; ${this.comment}\n`;
  }
}

export class SetupCommand implements GcodeCommand {
  constructor(
    private feedRate: number,
    private rapidFeedRate: number,
    private laserPower: number
  ) {}

  execute(): string {
    return `G21 ; Set units to millimeters
G90 ; Absolute positioning
G0 F${this.rapidFeedRate} S0 ; Set rapid feed rate and ensure laser is off
G1 F${this.feedRate} ; Set cutting feed rate
`;
  }
}

export class EndProgramCommand implements GcodeCommand {
  execute(): string {
    return "M30 ; Program end\n";
  }
}
