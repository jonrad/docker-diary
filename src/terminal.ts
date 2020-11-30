import pty = require('node-pty');
import {exit} from 'process';

class DisposableWrapper implements pty.IDisposable {
  constructor(private readonly onDispose: () => void) {}

  dispose(): void {
    this.onDispose();
  }
}

export class Terminal {
  private columns: number | undefined;
  private rows: number | undefined;
  private current: pty.IPty | undefined;
  private readonly previousRawMode: boolean;

  private buffer: string[] = [];

  private disposables: pty.IDisposable[] = [];

  constructor(
    private readonly onData: (data: string) => Promise<void>,
    private readonly onExit: () => void
  ) {
    this.setDimensions();

    process.stdout.on('resize', () => {
      this.setDimensions();
    });

    this.previousRawMode = process.stdin.isRaw;
  }

  private setDimensions() {
    this.columns = process.stdout.columns || undefined;
    this.rows = process.stdout.rows || undefined;
    if (this.rows && this.columns && this.current) {
      this.current.resize(this.columns, this.rows);
    }
  }

  run(application: string, args: string[]) {
    this.stop();
    process.stdin.setRawMode(true);

    this.current = pty.spawn(application, args, {
      cols: this.columns,
      rows: this.rows,
      env: process.env as {[key: string]: string},
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
        process.stdin.setRawMode(this.previousRawMode);
        this.onExit();
      })
    );

    const listener = (d: string | Uint8Array) => {
      this.current?.write(d.toString());
    };

    process.stdin.on('data', listener);

    this.disposables.push(
      new DisposableWrapper(() => process.stdin.off('data', listener))
    );
  }

  stop() {
    this.disposables.forEach(d => d.dispose());
    this.disposables = [];
    this.buffer = [];
  }
}
