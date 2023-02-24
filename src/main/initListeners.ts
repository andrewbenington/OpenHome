import { ipcMain, app } from 'electron';
import {
  initializeFolders,
  selectFile,
  readBytesFromFile,
} from './fileHandlers';
import { loadGen12Lookup, registerGen12Lookup, loadOHPKMs } from './loadData';
import writePKMToFile, { deleteOHPKMFile } from './writePKMToFile';
import fs from 'fs';

function initListeners() {
  ipcMain.on('write-ohpkm', async (event, bytes: Uint8Array) => {
    writePKMToFile(bytes, 'ohpkm');
  });

  ipcMain.on('delete-ohpkm-files', async (event, fileNames: string[]) => {
    fileNames.forEach((fn) => deleteOHPKMFile(fn));
  });

  ipcMain.on('read-gen12-lookup', async (event) => {
    console.log('read-gen12-lookup');
    const appDataPath = app.getPath('appData');
    let lookupMap;
    try {
      lookupMap = loadGen12Lookup();
    } catch (e) {
      console.log('no gen12 lookup file');
    }
    event.reply('gen12-lookup-read', lookupMap);
  });

  ipcMain.on('write-gen12-lookup', async (event, gen12LookupString) => {
    console.log('write-gen12-lookup', gen12LookupString);
    registerGen12Lookup(gen12LookupString);
  });

  ipcMain.on('read-home-data', async (event) => {
    console.log('read-home-data');
    const appDataPath = app.getPath('appData');
    initializeFolders(appDataPath);
    const byteMap = loadOHPKMs();
    event.reply('home-data-read', byteMap);
  });

  ipcMain.on('read-home-box', async (event, boxName) => {
    console.log('read-home-box', boxName);
    const appDataPath = app.getPath('appData');
    const boxString = fs.readFileSync(
      `${appDataPath}/open-home/storage/boxes/${boxName}.csv`,
      {
        encoding: 'utf8',
      }
    );
    console.log(
      `${appDataPath}/open-home/storage/boxes/${boxName}.csv`,
      boxName
    );
    event.reply('home-box-read', boxString);
  });

  ipcMain.on('write-home-box', async (event, { boxName, boxString }) => {
    const appDataPath = app.getPath('appData');
    fs.writeFileSync(
      `${appDataPath}/open-home/storage/boxes/${boxName}.csv`,
      boxString
    );
  });

  ipcMain.on('read-save-file', async (event, arg) => {
    console.log('select-save-file', arg);
    const filePaths = await selectFile();
    if (filePaths) {
      const fileBytes = readBytesFromFile(filePaths[0]);
      event.reply('save-file-read', { path: filePaths[0], fileBytes });
    } else {
      event.reply('save-file-read', { path: undefined, fileBytes: undefined });
    }
  });

  ipcMain.on('write-save-file', async (event, { bytes, path }) => {
    console.log('writing', path);
    fs.writeFileSync(path, bytes);
  });
}

export default initListeners;
