import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { app, BrowserWindow, dialog, shell } from 'electron'
import { join } from 'path'
import icon from '../../resources/icon.ico?asset'
import version from '../consts/JSON/version.json'
import { initializeFolders } from './fileHandlers'
import { initListeners, OpenHomeAppBackend } from './initListeners'
import MenuBuilder from './menu'
import { migrateAll } from './migrateStorage'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 720,
    show: false,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
    },
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()

    const menuBuilder = new MenuBuilder(mainWindow)
    menuBuilder.buildMenu()
  })

  mainWindow.on('close', (event) => {
    event.preventDefault()
    if (mainWindow?.isDocumentEdited()) {
      dialog
        .showMessageBox({
          message: 'You have unsaved changes. Save changes?',
          buttons: ['Cancel', 'Discard', 'Save'],
        })
        .then((response) => {
          if (response.response === 1) {
            app.exit()
          }
        })
    } else {
      app.exit()
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()
  initializeFolders()
  const backend = new OpenHomeAppBackend()
  initListeners(backend)
  migrateAll()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.setAboutPanelOptions({
  applicationName: 'OpenHome',
  applicationVersion: version.version,
  version: `Build Date ${version.build_date}`,
  website: 'https://andrewbenington.github.io/OpenHome',
  authors: ['Andrew Benington'],
})
