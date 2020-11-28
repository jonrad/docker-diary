import fs = require('fs');

export interface DockerfileWriter {
  write(line: string): void;
}

export class NullDockerfileWriter implements DockerfileWriter {
  write(): void {}
}

export class AppendingDockerfileWriter implements DockerfileWriter {
  constructor(private readonly dockerfile: string) {}

  write(line: string): void {
    fs.appendFileSync(this.dockerfile, line);
  }
}
