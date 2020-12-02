import { ITerminal } from "./terminal";
import * as pty from './node-pty';

class DisposableWrapper {
  constructor(private readonly onDispose: () => void) {}

  dispose(): void {
    this.onDispose();
  }
}

export class CommandRunner {
  private current: any | undefined;

  private buffer: string[] = [];
  private disposables: any[] = [];

  constructor(
    private readonly terminal: ITerminal,
    private readonly onData: (data: string) => Promise<void>,
    private readonly onExit: () => void
  ) {
    terminal.subscribeReceivedUserInput((input) => this.handleInput(input));
    terminal.subscribeUserResized((cols, rows) => {
      this.updateDimensions();
    })
  }

  public updateDimensions() {
    const columns = this.terminal.getColumns();
    const rows = this.terminal.getRows();
    if (columns && rows && this.current) {
      this.current.resize(columns, rows);
    }
  }

  run(pty: pty.NodePty, application: string, args: string[]) {
    this.stop();

    this.current = pty.spawn(application, args, {
      cols: this.terminal.getColumns(),
      rows: this.terminal.getRows()
    });

    let waiting = false;
    this.disposables.push(
      this.current.onData(async (d: string | Uint8Array) => {
        if (waiting) {
          this.buffer.push(d.toString());
          return;
        }

        try {
          waiting = true;
          await this.onData(d.toString());
          while (this.buffer.length > 0) {
            const next = this.buffer.unshift();
            await this.onData(next.toString());
          }
        } finally {
          waiting = false;
        }
      })
    );

    this.disposables.push(
      this.current.onExit(() => {
        this.onExit()
      })
    );

  }

  public handleInput(input: string) {
    this.current?.write(input);
  }

  stop() {
    this.disposables.forEach(d => d.dispose());
    this.disposables = [];
    this.buffer = [];
    this.current?.kill();
    this.current = undefined;
  }
}
