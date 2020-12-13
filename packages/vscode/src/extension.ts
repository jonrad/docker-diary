import * as vscode from 'vscode';
import path = require('path');
import * as fs from 'fs';
import { runDockerfileBuilder } from 'dockerfile-builder-lib/build/app';
import { Pseudoterminal } from 'vscode';
import { AbstractTerminal } from 'dockerfile-builder-lib/build/terminal';
import { dockerfileEmpty } from 'dockerfile-builder-lib/build/dockerfileEmpty';
import * as pty from 'dockerfile-builder-lib/build/node-pty';

function getCoreNodeModule(moduleName: string): any {
  try {
      return require(`${vscode.env.appRoot}/node_modules.asar/${moduleName}`);
  } catch (err) { }

  try {
      return require(`${vscode.env.appRoot}/node_modules/${moduleName}`);
  } catch (err) { }

  return null;
}

const nodePty = getCoreNodeModule('node-pty') as pty.NodePty;

export function activate(context: vscode.ExtensionContext) {
  class DockerfileBuilderPty extends AbstractTerminal implements Pseudoterminal {
    private dimensions?: vscode.TerminalDimensions;

    writeEmitter: vscode.EventEmitter<string> = new vscode.EventEmitter<string>();
    exitEmitter: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();

    constructor() {
      super();
    }

    // abstract terminal
    writeOutput(text: string): void {
      this.writeEmitter.fire(text);
    }

    getColumns(): number {
      return this.dimensions?.columns || 0;
    }

    getRows(): number {
      return this.dimensions?.rows || 0;
    }

    //pseudo terminal
    onDidWrite: vscode.Event<string> = this.writeEmitter.event;

    onDidClose?: vscode.Event<void> = this.exitEmitter.event;

    setDimensions(dimensions: vscode.TerminalDimensions): void {
      this.dimensions = dimensions;
      this.emitUserResized(dimensions.columns, dimensions.rows);
    }

    open(initialDimensions: vscode.TerminalDimensions | undefined): void {
      if (initialDimensions !== undefined) {
        this.setDimensions(initialDimensions);
      }
    }

    close(): void {
      //TODO
      console.log("User quit vscode terminal");
    }

    handleInput(data: string): void {
      this.emitReceivedUserInput(data);
    }
  }

  const getBaseImage = async () => {
    const baseImage = await vscode.window.showInputBox({
      value: "ubuntu",
      prompt: "Base Image"
    });

    return baseImage;
  };

  const runForPath = async (dockerfile: string) => {

    const dockerfileExists = !(await dockerfileEmpty(dockerfile));
    const rootDirectory = path.dirname(dockerfile);

    const dockerfileBuilderPty = new DockerfileBuilderPty();

    const args = {
      cwd: rootDirectory,
      '_': [] as string[],
      'docker': vscode.workspace.getConfiguration("dockerfile-builder").get<string>("docker"),
      dockerfile: undefined as string | undefined
    };

    if (!dockerfileExists) {
      const dockerfile = await getBaseImage();

      if (!dockerfile) {
        return;
      }

      args['_'].push(dockerfile);
    } else {
      args['dockerfile'] = dockerfile;
    }

    const vscodeTerminal = vscode.window.createTerminal({
      name: "dockerfile-builder",
      pty: dockerfileBuilderPty
    });

    vscodeTerminal.show();

    try {
      const result = await runDockerfileBuilder(nodePty, dockerfileBuilderPty, args);
      if (result && result.reason) {
        vscode.window.showErrorMessage(
          `Dockerfile builder failed: ${result.reason}`
        );
      }
    } catch (e) {
      vscode.window.showErrorMessage(
        `Dockerfile builder failed unexpectedly: ${e}`
      );
    } finally {
      dockerfileBuilderPty.exitEmitter.fire();
    }
  };

  // If in an active dockerfile, use that
  // otherwise, if there exists exactly on dockerfile in the directory, use that
  // otherwise, just use "Dockerfile"
  const getDockerfile = async () => {
    if (vscode.window.activeTextEditor?.document?.fileName?.match(/Dockerfile$/)) {
      return vscode.window.activeTextEditor.document.fileName;
    }

    const directory = vscode.workspace.rootPath;

    if (!directory) {
      vscode.window.showErrorMessage("Must be in a project");
      return;
    }

    const dockerfilesInRoot = (await vscode.workspace.findFiles("*Dockerfile"))
      .map(f => f.fsPath)
      .filter(f => path.extname(f) === "Dockerfile" || path.basename(f) === "Dockerfile");

    if (dockerfilesInRoot.length === 1) {
      return dockerfilesInRoot[0];
    }

    return path.join(directory, "Dockerfile");
  };

  context.subscriptions.push(vscode.commands.registerCommand('dockerfile-builder.runForWorkspace', async () => {
    const dockerfile = await getDockerfile();

    if (!dockerfile) {
      return;
    }

    if (!fs.existsSync(dockerfile)) {
      // Need to create the file so vs code can open it
      fs.writeFileSync(dockerfile, "");
    }

    await vscode.window.showTextDocument(vscode.Uri.file(dockerfile));

    await runForPath(dockerfile);
  }));

  context.subscriptions.push(vscode.commands.registerCommand('dockerfile-builder.runForFile', async (uri: vscode.Uri) => {
    await vscode.window.showTextDocument(uri);
    await runForPath(uri.fsPath);
  }));
}

export function deactivate() {}
