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
  .usage('Usage: $0 [options] [image]')
  //help
  .help('help')
  .alias('help', 'h')
  //filter file
  .alias('f', 'filter')
  .nargs('f', 1)
  .describe('f', 'Filter file')
  //docker path
  .nargs('docker', 1)
  .describe('docker', 'Path of docker binary')
  //docker file
  .nargs('dockerfile', 1)
  .describe('dockerfile', 'Dockerfile location, defaults to ./Dockerfile')
  //mode
  /*.alias('m', 'mode')
  .describe('mode', '[shell|docker|stdio] - note only shell currently works')
  .choices('mode', ['shell', 'docker', 'stdio', 'testing'])*/
  //cwd
  .nargs('cwd', 1)
  .alias('cwd', 'c')
  .describe('cwd', 'Current Working Directry')
  //dry run
  .alias('dry', 'd')
  .describe("dry run. Do not save to dockerfile")
  .boolean('dry')
  //the year of the devil
  .epilog('https://github.com/jonrad/dockerfile-builder');

const argv = yargs.argv;

// Need at most one arg, the image name
if ((argv._?.length || 0) > 1) {
  // todo fix this
  yargs.showHelp();
  exit();
}

async function start() {
  const previousRawMode = process.stdin.isRaw;
  process.stdin.setRawMode(true);

  const terminal = new ConsoleTerminal();

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
