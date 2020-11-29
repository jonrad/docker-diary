import fs = require('fs');
import resources from './resources';
import {DockerfileWriter} from './dockerfileWriter';
import {CommandFilter} from './filter';
import {LineProcessor, DockerwriteCommandProcessor} from './lineProcessor';
import {terminal} from './terminal';

export class ModeShell {
  private readonly lineProcessor: LineProcessor;
  private readonly terminal: terminal;

  constructor(
    private readonly dockerfileWriter: DockerfileWriter,
    private readonly filter: CommandFilter
  ) {
    this.lineProcessor = new LineProcessor(
      new DockerwriteCommandProcessor(dockerfileWriter, filter)
    );

    this.terminal = new terminal((d: string) => {
      this.lineProcessor.process(d.toString());
      process.stdout.write(d);
    });
  }

  run(image: string) {
    this.terminal.run('docker', [
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
    ]);
  }
}
