import child_process = require('child_process');
import fs = require('fs');
import resources from './resources';
import {DockerfileWriter} from './dockerfileWriter';
import {CommandFilter} from './filter';
import {LineProcessor, DockerwriteCommandProcessor} from './lineProcessor';

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
    const child = child_process.spawn(
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
      {stdio: [process.stdin, 'pipe', process.stderr]}
    );

    child.stdout.on('data', (d: string | Uint8Array) => {
      process.stdout.write(d);
      this.lineProcessor.process(d.toString());
    });
  }
}
