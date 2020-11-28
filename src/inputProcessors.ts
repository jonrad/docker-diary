import readline = require('readline');

type subscriber = (input: string) => void

//extends events.EventEmitter
export interface InputProcessor {
  subscribe(listener: subscriber): void;

  unsubscribe(listener: subscriber): void;

  start(): void;

  stop(): void;
}

export class ConsoleInputProcessor implements InputProcessor {
  private readonly subscribers: subscriber[] = [];

  private input: readline.Interface | undefined = undefined;

  start(): void {
    this.stop();
    this.input = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });

    if (this.subscribers) {
      this.subscribers.forEach(s => this.subscribe(s));
      this.subscribers.splice(0, this.subscribers.length);
    }
  }

  stop(): void {
    if (!this.input) {
      return;
    }

    this.input.close();
    this.input = undefined;
  }

  subscribe(listener: subscriber): void {
    if (!this.input) {
      this.subscribers.push(listener);
    } else {
      this.input.on('line', listener);
    }
  }

  unsubscribe(listener: subscriber): void {
    if (!this.input) {
      const index = this.subscribers.indexOf(listener);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    } else {
      this.input.off('line', listener);
    }
  }
}
