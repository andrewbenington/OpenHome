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
  loadRecentSaves,
  addRecentSave,
  removeRecentSave,
} from './loadData';
import writePKMToFile, { deleteOHPKMFile } from './writePKMToFile';
import fs from 'fs';
import { StringToStringMap } from 'types/types';
import path from 'path';

function initListeners() {
  ipcMain.on('write-ohpkm', async (_, bytes: Uint8Array) => {
    writePKMToFile(bytes);
  });

  ipcMain.on('delete-ohpkm-files', async (_, fileNames: string[]) => {
    fileNames.forEach((fn) => deleteOHPKMFile(fn));
  });

  ipcMain.handle('read-gen12-lookup', async (event) => {
    let lookupMap;
    try {
      lookupMap = loadGen12Lookup();
    } catch (e) {
      console.log('no gen12 lookup file');
    }
    return lookupMap;
  });

  ipcMain.on('write-gen12-lookup', async (_, lookupMap) => {
    console.log('write-gen12-lookup', lookupMap);
    registerGen12Lookup(lookupMap);
  });

  ipcMain.handle('read-gen345-lookup', async () => {
    let lookupMap;
    try {
      lookupMap = loadGen345Lookup();
    } catch (e) {
      console.log('no gen345 lookup file');
    }
    return lookupMap;
  });

  ipcMain.on('write-gen345-lookup', async (_, lookupMap) => {
    console.log('write-gen345-lookup', lookupMap);
    registerGen345Lookup(lookupMap);
  });

  ipcMain.handle('read-recent-saves', async () => {
    let recentSaves;
    try {
      recentSaves = loadRecentSaves();
    } catch (e) {
      console.error('no save refs file');
    }
    return recentSaves;
  });

  ipcMain.on('add-recent-save', async (_, saveRef) => {
    addRecentSave(saveRef);
  });

  ipcMain.on('remove-recent-save', async (_, saveRef) => {
    removeRecentSave(saveRef);
  });

  ipcMain.handle('read-home-mons', async () => {
    const appDataPath = app.getPath('appData');
    initializeFolders(appDataPath);
    return loadOHPKMs();
  });

  ipcMain.handle('read-home-boxes', async (_, boxName) => {
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
    const boxesMap: StringToStringMap = {};
    boxesMap[`${boxName}`] = boxString;
    return boxesMap;
  });

  ipcMain.on('write-home-box', async (event, { boxName, boxString }) => {
    const appDataPath = app.getPath('appData');
    fs.writeFileSync(
      `${appDataPath}/OpenHome/storage/boxes/${boxName}.csv`,
      boxString
    );
  });

  ipcMain.handle('read-save-file', async (_, filePath) => {
    let filePaths = filePath;
    if (!filePaths) {
      filePaths = await selectFile();
    }
    if (filePaths) {
      const fileBytes = readBytesFromFile(filePaths[0]);
      const createdDate = getFileCreatedDate(filePaths[0]);
      return {
        path: filePaths[0],
        fileBytes,
        createdDate,
      };
    } else {
      return {};
    }
  });

  ipcMain.on('write-save-file', async (_, { bytes, path }) => {
    console.log('writing', path);
    fs.writeFileSync(path, bytes);
  });

  ipcMain.handle('get-resources-path', (event) => {
    return app.isPackaged ? path.join(process.resourcesPath, 'resources') : path.join(app.getAppPath() + 'resources');
  });
}

export default initListeners;
