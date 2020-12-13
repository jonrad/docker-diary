import uuid = require('uuid');
import {AppendingDockerfileWriter, NullDockerfileWriter, DockerfileWriter} from './dockerfileWriter';
import {FileCommandFilter, NullCommandFilter, CommandFilter} from './filter';
import {ModeShell} from './modeShell';
import { ITerminal } from './terminal';
import * as pty from './node-pty';
import { dockerfileEmpty } from './dockerfileEmpty';
import * as which from 'which';

export class RunFailure {
  constructor(
    readonly reason: string
  ) {}
}

export interface RunArgs {
  _?: string[];

  cwd?: string;

  docker?: string

  dockerfile?: string

  dry?: boolean

  mode?: string

  filter?: string
}

export async function runDockerfileBuilder(
  pty: pty.NodePty,
  terminal: ITerminal,
  argv: RunArgs
): Promise<void | RunFailure> {
  if (argv.cwd) {
    process.chdir(argv.cwd);
  }

  const runFailure = (error: string) => {
    return new RunFailure(error);
  }
  //docker binary
  const docker = argv.docker || which.sync('docker', {nothrow: true});

  if (!docker) {
    return runFailure("Cannot find docker");
  }

  const dockerfile = argv.dockerfile || 'Dockerfile';
  const dockerfileWriter: DockerfileWriter = argv.dry
    ? new NullDockerfileWriter()
    : new AppendingDockerfileWriter(dockerfile);

  const mode = argv.mode || 'shell';

  const filter: CommandFilter = argv.filter
    ? FileCommandFilter.build(argv.filter as string)
    : new NullCommandFilter();

  let [image] = argv._ || [];

  const isDockerfileEmpty = await dockerfileEmpty(dockerfile);
  if (image && !isDockerfileEmpty) {
    //TODO this should work...
    return runFailure(
      'Specified an image but dockerfile already exists. This will overwrite your dockerfile. Use force\n'
    );
  }

  if (!image && isDockerfileEmpty) {
    //TODO this should throw
    return runFailure(
      'Please specify a base image or an existing dockerfile containing a base image\n'
    );
  }

  if (!image) {
    const id = uuid.v4();
    image = `docker-builder:${id}`;
    terminal.writeOutput('Building from current Dockerfile\n');

    let onFinish: (value: number) => void;
    const promise = new Promise((resolve) => {
      onFinish = resolve;
    })

    const spawned = pty.spawn(docker, [
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

    spawned.onExit((e) => onFinish(e.exitCode))
    const exitCode = await promise;
    if (exitCode) {
      return runFailure(`Failed to build docker image. Got exit code: ${exitCode}`);
    }
  } else {
    dockerfileWriter.write(`FROM ${image}\n`);
  }

  if (!image) {
    return runFailure('Must specify an image or a Dockerfile that exists');
  }

  if (mode === 'shell') {
    const app = new ModeShell(
      pty,
      terminal,
      docker,
      dockerfileWriter,
      filter
    );
    await app.run(image);
  } else if (mode === 'docker') {
    //const app = new ModeDocker(dockerfileWriter, filter);
    //app.run(image);
  }
}
