import fs = require('fs');
import resources from './resources';
import {DockerfileWriter} from './dockerfileWriter';
import {CommandFilter} from './filter';
import {LineProcessor, DockerwriteCommandProcessor} from './lineProcessor';
import {WriteStream} from 'tty';
import pty = require('node-pty');
import {exit} from 'process';

export class ModeShell {
  private readonly lineProcessor: LineProcessor;

  constructor(
    private dockerfileWriter: DockerfileWriter,
    private filter: CommandFilter
  ) {
    this.lineProcessor = new LineProcessor(
      new DockerwriteCommandProcessor(dockerfileWriter, filter)
    );
  }

  run(image: string) {
    const size = process.stdout.getWindowSize();

    const child = pty.spawn(
      'docker',
      [
        'run',
        '-it',
        '--rm',
        image,
        'bash',
        '-c',
        fs.readFileSync(resources.promptCommand).toString() +
          '\n' +
          'PROMPT_COMMAND="promptCommand" bash',
      ],
      {
        cols: size[0],
        rows: size[1],
        env: process.env as {[key: string]: string},
      }
    );

    child.on('data', (d: string | Uint8Array) => {
      process.stdout.write(d);
    });

    const isRaw = process.stdin.isRaw;
    process.stdin.setRawMode(true);

    process.stdin.on('data', (d: string | Uint8Array) => {
      const data = d.toString();
      child.write(data);
      this.lineProcessor.process(data);
    });

    child.onExit(() => {
      process.stdin.setRawMode(isRaw);
      exit(0);
    });

    //TODO handle resizing of term
  }
}
