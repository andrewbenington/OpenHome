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
  loadGen34Lookup,
  registerGen34Lookup,
  loadSaveRefs,
  addSaveRef,
} from './loadData';
import writePKMToFile, { deleteOHPKMFile } from './writePKMToFile';
import fs from 'fs';

function initListeners() {
  ipcMain.on('write-ohpkm', async (event, bytes: Uint8Array) => {
    writePKMToFile(bytes);
  });

  ipcMain.on('delete-ohpkm-files', async (event, fileNames: string[]) => {
    fileNames.forEach((fn) => deleteOHPKMFile(fn));
  });

  ipcMain.on('read-gen12-lookup', async (event) => {
    console.log('read-gen12-lookup');
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

  ipcMain.on('read-gen34-lookup', async (event) => {
    console.log('read-gen34-lookup');
    let lookupMap;
    try {
      lookupMap = loadGen34Lookup();
    } catch (e) {
      console.log('no gen34 lookup file');
    }
    event.reply('gen34-lookup-read', lookupMap);
  });

  ipcMain.on('write-gen34-lookup', async (event, gen34LookupString) => {
    console.log('write-gen34-lookup', gen34LookupString);
    registerGen34Lookup(gen34LookupString);
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
      `${appDataPath}/OpenHome/storage/boxes/${boxName}.csv`,
      {
        encoding: 'utf8',
      }
    );
    console.log(
      `${appDataPath}/OpenHome/storage/boxes/${boxName}.csv`,
      boxName
    );
    event.reply('home-box-read', boxString);
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
