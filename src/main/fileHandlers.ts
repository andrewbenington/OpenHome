import { dialog } from 'electron';
import fs from 'fs';
import _ from 'lodash';

export function initializeFolders(appDataPath: string) {
  if (!fs.existsSync(`${appDataPath}/open-home/storage/boxes`)) {
    fs.mkdirSync(`${appDataPath}/open-home/storage/boxes`);
  }
  _.range(36).forEach((boxNum) => {
    if (
      !fs.existsSync(
        `${appDataPath}/open-home/storage/boxes/Box ${(
          boxNum + 1
        ).toString()}.csv`
      )
    ) {
      fs.writeFileSync(
        `${appDataPath}/open-home/storage/boxes/Box ${(
          boxNum + 1
        ).toString()}.csv`,
        ''
      );
    }
  });
  if (!fs.existsSync(`${appDataPath}/open-home/storage/mons`)) {
    fs.mkdirSync(`${appDataPath}/open-home/storage/mons`, { recursive: true });
  }
  if (!fs.existsSync(`${appDataPath}/open-home/storage/lookup`)) {
    fs.mkdirSync(`${appDataPath}/open-home/storage/lookup`, { recursive: true });
  }
  fs.opendir('../', (err, dir) => {
    if (err) console.log('Error:', err);
    else {
      // Print the pathname of the directory
      console.log('\nPath of the directory:', dir.path);
      dir.closeSync();
    }
  });
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate('HOMEDATA'));
}

export async function selectFile() {
  // Open file picker
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
  });
  return result.filePaths;
}

export async function selectFiles() {
  // Open file picker
  const result = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
  });
  return result.filePaths;
}

export function readBytesFromFile(path: string) {
  const fileBytes = fs.readFileSync(path);
  if (fileBytes) {
    return new Uint8Array(fileBytes);
  } else {
    return undefined;
  }
}

export function readStringFromFile(path: string) {
  try {
    return fs.readFileSync(path, { encoding: 'utf8' });
  } catch (e) {
    console.log(`error reading ${path}: ${e}`);
  }
  return '';
}

export function writeStringToFile(path: string, content: string) {
  return fs.writeFileSync(path, content);
}

export function writeBytesToPath(path: string, bytes: Uint8Array) {
  fs.writeFileSync(path, bytes);
}
