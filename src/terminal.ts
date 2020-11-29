import pty = require('node-pty');
import { exit } from 'process';

class DisposableWrapper implements pty.IDisposable {
  constructor(private readonly onDispose: () => void) {}

  dispose(): void {
    this.onDispose();
  }
}

export class terminal {
  private columns: number | undefined;
  private rows: number | undefined;
  private current: pty.IPty | undefined;
  private readonly previousRawMode: boolean;

  private disposables: pty.IDisposable[] = [];

  constructor(private readonly onData: (data: string) => void) {
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

    this.disposables.push(
      this.current.onData((d: string | Uint8Array) => {
        this.onData(d.toString());
      })
    );

    this.disposables.push(
      this.current.onExit(() => {
        process.stdin.setRawMode(this.previousRawMode);
        exit(0);
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
  }
}
