/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import { app, BrowserWindow, ipcMain, Menu, MenuItem, shell } from 'electron';
import log from 'electron-log';
import { autoUpdater } from 'electron-updater';
import fs from 'fs';
import _ from 'lodash';
import path from 'path';
import writePKMToFile, { deleteOHPKMFile } from './writePKMToFile';
import {
  initializeFolders,
  readBytesFromFile,
  readStringFromFile,
  selectFile,
} from './fileHandlers';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import { loadGen12Lookup, loadOHPKMs, registerGen12Lookup } from './loadData';

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

ipcMain.on('write-ohpkm', async (event, bytes: Uint8Array) => {
  writePKMToFile(bytes, 'ohpkm');
});

ipcMain.on('delete-ohpkm', async (event, fileName: string) => {
  deleteOHPKMFile(fileName);
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

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    setMainMenu();
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app;

function setMainMenu() {
  const template = [
    {
      label: 'OpenHome',
      submenu: [
        {
          label: 'Preferences',
          accelerator: 'CmdOrCtrl+P',
          click() {
            console.log('Oh, hi there!');
          },
        },
      ],
    },
    {
      label: 'File',
      submenu: [
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click() {
            mainWindow?.webContents.send('save');
          },
        },
        {
          label: 'Reset',
          accelerator: 'CmdOrCtrl+X',
          click() {
            mainWindow?.webContents.send('reset');
          },
        },
        {
          label: 'Reset And Close Saves',
          accelerator: 'Shift+CmdOrCtrl+X',
          click() {
            mainWindow?.webContents.send('reset-close');
          },
        },
      ],
    },
    {
      label: 'Filter',
      submenu: [
        {
          label: 'Hello',
          accelerator: 'Shift+CmdOrCtrl+H',
          click() {
            console.log('Oh, hi there!');
          },
        },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
