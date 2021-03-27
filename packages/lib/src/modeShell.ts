import fs = require('fs');
import resources from './resources';
import {DockerfileWriter} from './dockerfileWriter';
import {CommandFilter} from './filter';
import {LineProcessor, ShellModeCommandProcessor} from './lineProcessor';
import {CommandRunner} from './commandRunner';
import { ITerminal } from "./terminal";
import * as pty from './node-pty';

export class ModeShell {
  private readonly lineProcessor: LineProcessor;

  private readonly commandRunner: CommandRunner;

  constructor(
    private readonly pty: pty.NodePty,
    private readonly terminal: ITerminal,
    private readonly docker: string,
    private readonly dockerArgs: string[],
    private readonly dockerfileWriter: DockerfileWriter,
    private readonly filter: CommandFilter,
  ) {
    this.lineProcessor = new LineProcessor(
      new ShellModeCommandProcessor(dockerfileWriter, filter)
    );

    this.commandRunner = new CommandRunner(
      terminal,
      async (d: string) => {
        this.lineProcessor.process(d);
        terminal.writeOutput(d);
      }
    );
  }

  async run(image: string): Promise<void> {
    const args = [
      'run',
      '-it',
      '--rm',
      '--entrypoint',
      'bash',
      ...this.dockerArgs,
      image,
      '-c',
      fs.readFileSync(resources.promptCommand).toString() +
      '\n' +
      'PROMPT_COMMAND="promptCommand" bash',
    ];

    await this.commandRunner.run(
      this.pty,
      this.docker,
      args
    );
  }
}
