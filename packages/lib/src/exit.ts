import { ITerminal } from './terminal';

export function exit(terminal: ITerminal, code?: number) {
  if (!code) {
    terminal.exit();
  }

  //why is this not working...
  terminal.writeOutput("Failed, press key to quit\r\n");
  terminal.subscribeReceivedUserInput((x) => {
    terminal.exit();
  });
}
