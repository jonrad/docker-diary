import { runDockerfileBuilder, RunArgs } from 'dockerfile-builder-lib/build/app';
import { AbstractTerminal } from 'dockerfile-builder-lib/build/terminal';
import { exit } from 'process';
import * as pty from 'node-pty';
import { error } from 'console';

class ConsoleTerminal extends AbstractTerminal {
  constructor() {
    super();
    process.stdin.on('data', (data: Buffer) => {
      super.emitReceivedUserInput(data.toString());
    })

    process.stdout.on('resize', () => {
      super.emitUserResized(process.stdout.columns, process.stdout.rows);
    });
  }

  getColumns(): number {
    return process.stdout.columns;
  }

  getRows(): number {
    return process.stdout.rows;
  }

  writeOutput(text: string): void {
    process.stdout.write(text);
  }
}

const yargs = require('yargs/yargs')(process.argv.slice(2))
  .usage('Usage: $0 [options] -- [extra docker args]')
  //help
  .help('help')
  .alias('help', 'h')
  //filter file
  .option('filter', {
    nargs: 1,
    desc: 'Filter file (future version)',
    alias: 'f'
  })
  //docker path
  .option('image', {
    nargs: 1,
    desc: 'Base image, required if the dockerfile doesn\'t exist',
  })
  //docker path
  .option('docker', {
    nargs: 1,
    desc: 'Path of docker binary',
  })
  //docker file
  .option('dockerfile', {
    nargs: 1,
    desc: 'Dockerfile location, defaults to ./Dockerfile',
  })
  //cwd
  .option('cwd', {
    nargs: 1,
    type: 'boolean',
    desc: 'Current Working Directry',
    alias: ['c'],
  })
  //dry run
  .option('dry', {
    type: 'boolean',
    desc: 'dry run. Do not save to dockerfile',
    alias: ['d'],
  })
  .epilog('https://github.com/jonrad/dockerfile-builder');

const argv = yargs.argv;

async function start() {
  const previousRawMode = process.stdin.isRaw;
  process.stdin.setRawMode(true);

  const terminal = new ConsoleTerminal();
  argv.dockerArgs = argv._ || [];

  try {
    const result = await runDockerfileBuilder(
      pty,
      terminal,
      argv as RunArgs
    );

    if (result) {
      error(`Failed: ${result.reason}`);
    }
  } catch (e) {
    error(`Unexpected error: ${e}`);
  } finally {
    process.stdin.setRawMode(previousRawMode);
    exit();
  }
}

start();
