import fs = require('fs');

export interface CommandFilter {
  shouldSkip(command: string): boolean;
}

export class NullCommandFilter implements CommandFilter {
  shouldSkip(): boolean {
    return false;
  }
}

export class FileCommandFilter implements CommandFilter {
  public static build(file: string): CommandFilter {
    return new NullCommandFilter();
    /*const contents = fs.readFileSync(file, {encoding: 'utf-8'});
    const filters = contents
      .split(/[\r\n]/)
      .filter(f => !!f)
      .map(c => new RegExp(c));

    return new FileCommandFilter(filters);*/
  }

  private constructor(private readonly filters: RegExp[]) {}

  shouldSkip(command: string): boolean {
    return !!this.filters.find(x => x.test(command));
  }
}
