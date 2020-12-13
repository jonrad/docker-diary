import fs = require('fs');

export async function dockerfileEmpty(file: string): Promise<boolean> {
  console.log(file);
  if (!(fs.existsSync(file))) {
    return true;
  }

  //there's a race condition here. meh
  //also pretty inefficient
  const contents = (await fs.promises.readFile(file, {})).toString();

  return !/^FROM /m.test(contents)
}
