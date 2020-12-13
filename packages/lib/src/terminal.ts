import { EventEmitter } from 'events';

export interface ITerminal {
  getColumns(): number;

  getRows(): number;

  subscribeReceivedUserInput(handler: (input: string) => void): void;

  unsubscribeReceivedUserInput(handler: (input: string) => void): void;

  subscribeUserResized(handler: (cols: number, rows: number) => void): void;

  unsubscribeUserResized(handler: (cols: number, rows: number) => void): void;

  writeOutput(text: string): void;
}

export abstract class AbstractTerminal extends EventEmitter implements ITerminal {
  abstract getColumns(): number;

  abstract getRows(): number;

  protected emitReceivedUserInput(text: string): void {
    this.emit('input', text);
  }

  protected emitUserResized(cols: number, rows: number): void {
    this.emit('resize', cols, rows);
  }

  abstract writeOutput(text: string): void;

  subscribeReceivedUserInput(handler: (input: string) => void) {
    this.on('input', handler);
  }

  unsubscribeReceivedUserInput(handler: (input: string) => void) {
    this.off('input', handler);
  }

  subscribeUserResized(handler: (cols: number, rows: number) => void): void {
    this.on('resize', handler);
  }

  unsubscribeUserResized(handler: (cols: number, rows: number) => void): void {
    this.off('resize', handler);
  }
}

export class NullTerminal extends AbstractTerminal {
  getColumns(): number {
    return 0;
  }

  getRows(): number {
    return 0;
  }

  writeOutput(_text: string): void { }
}
