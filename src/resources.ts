import path = require('path');

function buildPath(subpath: string): string {
  return path.join(__dirname, './resources/', subpath);
}

export default {
  promptCommand: buildPath('prompt_command.sh'),
  preExec: buildPath('preexec.sh'),
};
