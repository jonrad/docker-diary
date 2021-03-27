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
  image?: string;

  cwd?: string;

  docker?: string

  dockerfile?: string

  dockerArgs?: string[]

  dry?: boolean

  mode?: string

  filter?: string
}

export async function runDockerDiary(
  pty: pty.NodePty,
  terminal: ITerminal,
  args: RunArgs
): Promise<void | RunFailure> {
  if (args.cwd) {
    process.chdir(args.cwd);
  }

  const runFailure = (error: string) => {
    return new RunFailure(error);
  }
  //docker binary
  const docker = args.docker || which.sync('docker', {nothrow: true});

  if (!docker) {
    return runFailure("Cannot find docker");
  }

  const dockerfile = args.dockerfile || 'Dockerfile';
  const dockerfileWriter: DockerfileWriter = args.dry
    ? new NullDockerfileWriter()
    : new AppendingDockerfileWriter(dockerfile);

  const mode = args.mode || 'shell';

  const filter: CommandFilter = args.filter
    ? FileCommandFilter.build(args.filter as string)
    : new NullCommandFilter();

  let image = args.image;

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
    image = `docker-diary:${id}`;
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
      args.dockerArgs || [],
      dockerfileWriter,
      filter
    );
    await app.run(image);
  } else if (mode === 'docker') {
    //const app = new ModeDocker(dockerfileWriter, filter);
    //app.run(image);
  }
}
