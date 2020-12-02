import fs = require('fs');
import {exit} from 'process';
import uuid = require('uuid');
import {AppendingDockerfileWriter, NullDockerfileWriter, DockerfileWriter} from './dockerfileWriter';
import {FileCommandFilter, NullCommandFilter, CommandFilter} from './filter';
import {ModeShell} from './modeShell';
import { ITerminal } from './terminal';
import * as pty from './node-pty';

export interface RunArgs {
  _?: string[];

  cwd?: string;

  dockerfile?: string

  dry?: boolean

  mode?: string

  filter?: string
}

export async function runDockerfileBuilder(
  pty: pty.NodePty,
  terminal: ITerminal,
  argv: RunArgs
) {
  if (argv.cwd) {
    process.chdir(argv.cwd);
  }

  const dockerfile = argv.dockerfile || 'Dockerfile';
  const dockerfileWriter: DockerfileWriter = argv.dry
    ? new NullDockerfileWriter()
    : new AppendingDockerfileWriter(dockerfile);

  const mode = argv.mode || 'shell';

  function debug(text: string) {
    fs.appendFileSync('debug.txt', text);
  }

  const filter: CommandFilter = argv.filter
    ? FileCommandFilter.build(argv.filter as string)
    : new NullCommandFilter();

  let [image] = argv._ || [];

  if (image && fs.existsSync(dockerfile)) {
    //TODO this should throw
    process.stderr.write(
      'Specified an image but dockerfile already exists. This will overwrite your dockerfile. Use force\n'
    );

    exit(1);
  }

  if (!image && !fs.existsSync(dockerfile)) {
    //TODO this should throw
    process.stderr.write(
      'Please specify a base image or an existing dockerfile\n'
    );

    exit(1);
  }

  if (!image) {
    const id = uuid.v4();
    image = `docker-builder:${id}`;
    console.log('Building from current Dockerfile\n');

    let onFinish: (value: unknown) => void;
    const promise = new Promise((resolve) => {
      onFinish = resolve;
    })

    const spawned = pty.spawn('docker', [
      'build',
      '-t',
      image,
      '.',
      '-f',
      dockerfile
    ], {
      cols: terminal.getColumns(),
      rows: terminal.getRows(),
    });

    spawned.onData((data: string) => {
      terminal.writeOutput(data.toString());
    })

    spawned.onExit(() => onFinish(undefined))
    await promise;
  } else {
    dockerfileWriter.write(`FROM ${image}\n`);
  }

  if (!image) {
    process.stderr.write('Must specify an image or a Dockerfile that exists');
    exit(1);
  }

  if (mode === 'shell') {
    const app = new ModeShell(
      pty,
      terminal,
      dockerfileWriter,
      filter
    );
    app.run(image);
  } else if (mode === 'docker') {
    //const app = new ModeDocker(dockerfileWriter, filter);
    //app.run(image);
  }
}