import {CommandFilter} from './filter';
import {DockerfileWriter} from './dockerfileWriter';

export class LineProcessor {
  private readonly regexp = /DOCKERFILE_BUILDER!([^!]*)!(.*)!DOCKERFILE_BUILDER/; //todo end line, start line

  constructor(private readonly commandProcessor: CommandProcessor) {}

  async process(line: string): Promise<boolean> {
    const matches = line.match(this.regexp);
    if (!matches) return false;
    const [, command, arg] = matches;
    await this.commandProcessor.process(command, arg);
    return true;
  }
}

export interface CommandProcessor {
  process(command: string, arg: string): Promise<void>;
}

export class DockerwriteCommandProcessor implements CommandProcessor {
  constructor(
    private readonly dockerfileWriter: DockerfileWriter,
    private readonly commandFilter: CommandFilter
  ) {}

  async process(command: string, arg: string): Promise<void> {
    if (command === 'RUN') {
      if (this.commandFilter.shouldSkip(arg)) {
        return;
      }

      if (arg) {
        //TODO fix me hack for live version
        if (arg.startsWith('cd ')) {
          this.dockerfileWriter.write(`WORKDIR "${arg.substr(3)}"\n`);
        } else {
          const statement = `RUN ${arg}\n`;

          this.dockerfileWriter.write(statement);
          //await this.onFileWrite(statement);
        }
      }
    } else if (command === 'WORKDIR') {
      this.dockerfileWriter.write(`WORKDIR ${arg}\n`);
    } else if (command === 'EXACT') {
      this.dockerfileWriter.write(`${arg}\n`);
    }
  }
}
