import fs = require('fs');
import {exit} from 'process';
import uuid = require('uuid');
import child_process = require('child_process');
import {AppendingDockerfileWriter, NullDockerfileWriter, DockerfileWriter} from './dockerfileWriter';
import {FileCommandFilter, NullCommandFilter, CommandFilter} from './filter';
import {ModeShell} from './modeShell';

const yargs = require('yargs/yargs')(process.argv.slice(2))
  .usage('Usage: $0 [options] [image]')
  //help
  .help('h')
  .alias('h', 'help')
  //filter file
  .alias('f', 'filter')
  .nargs('f', 1)
  .describe('f', 'Filter file')
  //docker file
  .nargs('dockerfile', 1)
  .describe('dockerfile', 'Dockerfile location, defaults to ./Dockerfile')
  //mode
  .alias('m', 'mode')
  .describe('mode', '[shell|docker|stdio] - note only shell currently works')
  .choices('mode', ['shell', 'docker', 'stdio', 'testing'])
  //dry run
  .boolean('d')
  .alias('d', 'dry')
  .describe("dry run. Don't save to dockerfile")
  //the year of the devil
  .epilog('copyright 2020');

const argv = yargs.argv;
const dockerfile = yargs.dockerfile || 'Dockerfile';
const dockerfileWriter: DockerfileWriter = argv.dry
  ? new NullDockerfileWriter()
  : new AppendingDockerfileWriter(dockerfile);

const mode = argv.mode || 'shell';

function debug(text: string) {
  fs.appendFileSync('debug.txt', text);
}

// Need at most one arg, the image name
if (argv._.length > 1) {
  yargs.showHelp();
  exit();
}

const filter: CommandFilter = argv.filter
  ? FileCommandFilter.build(argv.filter as string)
  : new NullCommandFilter();

if (argv.stdio) {
  //TODO
  /*const app = new ConsoleInputProcessor();
  app.subscribe(new LineProcessor(
  ));
  app.start();*/
} else if (!argv.testing) {
  //TODO better way to make this strongly typed
  let image: string | undefined = undefined;
  [image] = argv._;

  if (image && fs.existsSync(dockerfile)) {
    process.stderr.write(
      'Specified an image but dockerfile already exists. This will overwrite your dockerfile. Use force'
    );

    exit(1);
  }

  if (!image) {
    const id = uuid.v4();
    image = `docker-builder:${id}`;
    console.log('Building from current Dockerfile\n');

    child_process.execSync(`docker build -t ${image} .`, {
      stdio: 'inherit',
    });
  } else {
    dockerfileWriter.write(`FROM ${image}\n`);
  }

  if (!image) {
    process.stderr.write('Must specify an image or a Dockerfile that exists');
    exit(1);
  }

  if (mode === 'shell') {
    const app = new ModeShell(dockerfileWriter, filter);
    app.run(image);
  } else {
    //todo
  }
} else {
  console.log('testing testing 1 2 1 2');
}
