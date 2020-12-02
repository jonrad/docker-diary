import fs = require('fs');
import resources from './resources';
import {DockerfileWriter} from './dockerfileWriter';
import {CommandFilter} from './filter';
import {LineProcessor, ShellModeCommandProcessor} from './lineProcessor';
import {CommandRunner} from './commandRunner';
import {exit} from 'process';
import { ITerminal } from "./terminal";
import * as pty from './node-pty';

export class ModeShell {
  private readonly lineProcessor: LineProcessor;

  private readonly commandRunner: CommandRunner;

  constructor(
    private readonly pty: pty.NodePty,
    private readonly terminal: ITerminal,
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
      },
      () => terminal.exit()
    );
  }

  run(image: string) {
    this.commandRunner.run(
      this.pty,
      'docker',
      [
        'run',
        '-it',
        '--rm',
        '--entrypoint',
        'bash',
        image,
        '-c',
        fs.readFileSync(resources.promptCommand).toString() +
        '\n' +
        'PROMPT_COMMAND="promptCommand" bash',
      ]
    );
  }
}
