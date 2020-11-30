import fs = require('fs');
import resources from './resources';
import {DockerfileWriter} from './dockerfileWriter';
import {CommandFilter} from './filter';
import {LineProcessor, CommandProcessor} from './lineProcessor';
import {Terminal} from './terminal';
import {exit} from 'process';
import {spawn} from 'child_process';
import uuid = require('uuid');

class DockerModeCommandProcessor implements CommandProcessor {
  private image = 'ubuntu';

  constructor(
    private readonly dockerfileWriter: DockerfileWriter,
    private readonly commandFilter: CommandFilter,
    private readonly onNewImage: (image: string) => void
  ) {}

  async process(command: string, arg: string): Promise<void> {
    if (command === 'RUN') {
      if (this.commandFilter.shouldSkip(arg)) {
        return;
      }

      if (arg) {
        //TODO fix me hack for live version
        if (arg.startsWith('cd ')) {
          const statement = `WORKDIR "${arg.substr(3)}"\n`;
          this.dockerfileWriter.write(statement);
          const dockerfileContents = `FROM ${this.image}\n${statement}`;
          const newImage = await this.runBuild(dockerfileContents);
          if (newImage) {
            this.image = newImage;
            this.onNewImage(this.image);
          }
        } else {
          const statement = `RUN ${arg}\n`;

          this.dockerfileWriter.write(statement);

          const dockerfileContents = `FROM ${this.image}\n${statement}`;
          const newImage = await this.runBuild(dockerfileContents);
          if (newImage) {
            this.image = newImage;
            this.onNewImage(this.image);
          }
          //await this.onFileWrite(statement);
        }
      }
    } else if (command === 'WORKDIR') {
      this.dockerfileWriter.write(`WORKDIR ${arg}\n`);
    } else if (command === 'EXACT') {
      this.dockerfileWriter.write(`${arg}\n`);
    }
  }

  runBuild(dockerfileContents: string): Promise<string | undefined> {
    const id = uuid.v4();
    const image = `docker-builder:${id}`;
    const command = spawn('docker', ['build', '-t', image, '-']);

    let turnedOn = false;

    let resolve: ((data: string | undefined) => void) | undefined = undefined;

    const promise = new Promise<string | undefined>(r => {
      resolve = r;
    });

    command.on('exit', () => {
      if (resolve) resolve(image);
    });

    command.stdout.on('data', (d: string | Uint8Array) => {
      const text = d.toString();
      if (text.startsWith(' ---> Running in ')) {
        turnedOn = true;
      } else if (text.startsWith('Removing intermediate container')) {
        turnedOn = false;
      } else if (turnedOn) {
        const text = d.toString().replace(/\n/g, '\r\n');
        process.stdout.write(text);
      }
    });

    command.stdin.write(dockerfileContents);
    command.stdin.end();

    return promise;
  }
}

export class ModeDocker {
  private readonly lineProcessor: LineProcessor;
  private readonly terminal: Terminal;

  constructor(
    private readonly dockerfileWriter: DockerfileWriter,
    private readonly filter: CommandFilter
  ) {
    this.terminal = new Terminal(
      async (d: string) => {
        if (await this.lineProcessor.process(d.toString())) {
          //foo
        } else {
          process.stdout.write(d);
        }
      },
      () => exit(0)
    );

    this.lineProcessor = new LineProcessor(
      new DockerModeCommandProcessor(
        dockerfileWriter,
        filter,
        (image: string) => this.onNewImage(image)
      )
    );
  }

  onNewImage(image: string) {
    this.run(image);
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
      `${fs.readFileSync(resources.preExec).toString()}
bash --init-file <(type init && echo init)`,
    ]);
  }
}

/*
    child.stdout.on('data', async (d: string | Uint8Array) => {
      const lines = d.toString().split('\n');
      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i] + '\n';
        if (await lineProcessor.process(line)) {
          // processed successfully. this is a command
        } else {
          process.stdout.write(line);
        }
      }

      await lineProcessor.process(lines[lines.length - 1]);
      process.stdout.write(lines[lines.length - 1]);
    });


  const buildLineProcessor = (commandProcessor: CommandProcessor) => {
    return new LineProcessor(commandProcessor);
  };

  const lineProcessor = buildLineProcessor(
    new DockerwriteCommandProcessor(dockerfileWriter, filter)
  );
*/

/*const onLineProcessed = (() => {
  if (mode === 'shell') {
    return () => Promise.resolve();
  } else {
  }
})();*/
