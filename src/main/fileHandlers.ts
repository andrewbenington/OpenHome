import { dialog } from 'electron';
import fs from 'fs';
import _ from 'lodash';
import { G3SAV } from 'sav/G3SAV';
import { SAV } from 'sav/SAV';
import { bytesToUint32LittleEndian } from 'util/ByteLogic';

export function initializeFolders(appDataPath: string) {
  if (!fs.existsSync(`${appDataPath}/open-home/storage/boxes`)) {
    _.range(24).forEach((boxNum) =>
      fs.mkdirSync(
        `${appDataPath}/open-home/storage/boxes/box${boxNum
          .toString()
          .padStart(2, '0')}`,
        { recursive: true }
      )
    );
  }
  if (!fs.existsSync(`${appDataPath}/open-home/storage/mons`)) {
    fs.mkdirSync(`${appDataPath}/open-home/storage/mons`, { recursive: true });
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

export function readFileFromPath(path: string) {
  const fileBytes = fs.readFileSync(path);
  if (fileBytes) {
    return new Uint8Array(fileBytes);
  } else {
    return undefined;
  }
}

export function writeBytesToPath(path: string, bytes: Uint8Array) {
  fs.writeFileSync(path, bytes);
}

// const fileContentToSav = (fileContent: FileContent): SAV | undefined => {
//   let fileBytes = new Uint8Array(
//     fileContent.content as unknown as ArrayBuffer
//   );
//   switch (fileBytes.length) {
//     case 131072:
//       const saveIndexOne = bytesToUint32LittleEndian(fileBytes, 0xf20);
//       const saveIndexTwo = bytesToUint32LittleEndian(fileBytes, 0xef20);
//       const saveFile =
//         saveIndexOne > saveIndexTwo
//           ? new G3SAV(fileBytes)
//           : new G3SAV(fileBytes.slice(0xe000));
//       setSaveType(saveFile.saveType);
//       return saveFile;
//     case 524288:
//       setGenerationSelect('45');
//       setBytes(fileBytes);
//       return undefined;
//   }
// };
