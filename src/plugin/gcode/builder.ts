import { GcodeBuilder, GcodeCommand } from "./types";

export class GcodeBuilderImpl implements GcodeBuilder {
  private commands: GcodeCommand[] = [];

  addCommand(command: GcodeCommand): GcodeBuilder {
    this.commands.push(command);
    return this;
  }

  addComment(comment: string): GcodeBuilder {
    this.commands.push({
      execute: () => `; ${comment}\n`,
    });
    return this;
  }

  build(): string {
    return this.commands.map((cmd) => cmd.execute()).join("");
  }

  reset(): GcodeBuilder {
    this.commands = [];
    return this;
  }
}
