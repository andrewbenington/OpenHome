import { ipcMain, app } from 'electron';
import {
  initializeFolders,
  selectFile,
  readBytesFromFile,
  getFileCreatedDate,
} from './fileHandlers';
import {
  loadGen12Lookup,
  registerGen12Lookup,
  loadOHPKMs,
  loadGen345Lookup,
  registerGen345Lookup,
  loadSaveRefs,
  addSaveRef,
} from './loadData';
import writePKMToFile, { deleteOHPKMFile } from './writePKMToFile';
import fs from 'fs';
import { StringToStringMap } from 'types/types';

function initListeners() {
  ipcMain.on('write-ohpkm', async (event, bytes: Uint8Array) => {
    writePKMToFile(bytes);
  });

  ipcMain.on('delete-ohpkm-files', async (event, fileNames: string[]) => {
    fileNames.forEach((fn) => deleteOHPKMFile(fn));
  });

  ipcMain.handle('read-gen12-lookup', async (event) => {
    let lookupMap;
    try {
      lookupMap = loadGen12Lookup();
    } catch (e) {
      console.log('no gen12 lookup file');
    }
    return lookupMap
  });

  ipcMain.on('write-gen12-lookup', async (event, lookupMap) => {
    console.log('write-gen12-lookup', lookupMap);
    registerGen12Lookup(lookupMap);
  });

  ipcMain.handle('read-gen345-lookup', async (event) => {
    let lookupMap;
    try {
      lookupMap = loadGen345Lookup();
    } catch (e) {
      console.log('no gen345 lookup file');
    }
    return lookupMap
  });

  ipcMain.on('write-gen345-lookup', async (event, lookupMap) => {
    console.log('write-gen345-lookup', lookupMap);
    registerGen345Lookup(lookupMap);
  });

  ipcMain.on('read-save-refs', async (event) => {
    console.log('read-save-refs');
    let saveRefMap;
    try {
      saveRefMap = loadSaveRefs();
    } catch (e) {
      console.log('no save refs file');
    }
    event.reply('save-refs-read', saveRefMap);
  });

  ipcMain.on('add-save-ref', async (event, saveRef) => {
    addSaveRef(saveRef);
  });

  ipcMain.handle('read-home-mons', async (event) => {
    const appDataPath = app.getPath('appData');
    initializeFolders(appDataPath);
    return loadOHPKMs();
  });

  ipcMain.handle('read-home-boxes', async (event, boxName) => {
    const appDataPath = app.getPath('appData');
    const boxString = fs.readFileSync(
      `${appDataPath}/OpenHome/storage/boxes/${boxName}.csv`,
      {
        encoding: 'utf8',
      }
    );
    console.log(
      `${appDataPath}/OpenHome/storage/boxes/${boxName}.csv`,
      boxName
    );
    const boxesMap: StringToStringMap = {}
    boxesMap[`${boxName}`] = boxString
    return boxesMap
  });

  ipcMain.on('write-home-box', async (event, { boxName, boxString }) => {
    const appDataPath = app.getPath('appData');
    fs.writeFileSync(
      `${appDataPath}/OpenHome/storage/boxes/${boxName}.csv`,
      boxString
    );
  });

  ipcMain.on('read-save-file', async (event, filePath) => {
    let filePaths = filePath;
    if (!filePaths) {
      filePaths = await selectFile();
    }
    if (filePaths) {
      const fileBytes = readBytesFromFile(filePaths[0]);
      const createdDate = getFileCreatedDate(filePaths[0]);
      event.reply('save-file-read', {
        path: filePaths[0],
        fileBytes,
        createdDate,
      });
    } else {
      event.reply('save-file-read', {});
    }
  });

  ipcMain.on('write-save-file', async (event, { bytes, path }) => {
    console.log('writing', path);
    fs.writeFileSync(path, bytes);
  });
}

export default initListeners;
