/*
    const child = spawn(
      'docker',
      [
        'run',
        '-it',
        '--rm',
        image,
        'bash',
        '-c',
        `${fs.readFileSync(resources.preExec).toString()}
bash --init-file <(type init && echo init)`,
      ],
      {stdio: [process.stdin, 'pipe', process.stderr]}
    );

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
function runBuild(dockerfileContents: string): Promise<void> {
  const command = spawn('docker', ['build', '-']);

  let turnedOn = false;

  let resolve: (() => void) | undefined = undefined;

  const promise = new Promise<void>(r => {
    resolve = r;
  });

  command.on('exit', () => {
    if (resolve) resolve();
  });

  command.stdout.on('data', (d: string | Uint8Array) => {
    debug(d.toString());
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
*/

/*const onLineProcessed = (() => {
  if (mode === 'shell') {
    return () => Promise.resolve();
  } else {
    let dockerfileContents = `FROM ${image}\n`;
    return (line: string) => {
      dockerfileContents += line;
      return runBuild(dockerfileContents);
    };
  }
})();*/
