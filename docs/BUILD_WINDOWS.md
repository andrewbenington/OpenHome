# Building the application (Windows)

## Download and Install Node.js and npm

Node.js and the Node Package Manager (npm) will allow you to build the OpenHome application. Download the Node.js installer from the official website at https://nodejs.org/en/download/. Open the downloaded installer and run it, following the prompts and using the default configurations. After the installation is complete, open a PowerShell window by pressing the Windows key + R, typing `powershell` in the Run dialog, and pressing Enter.

Verify that Node.js and npm are installed by typing the following commands in the command prompt or PowerShell window:

```powershell
node -v
npm -v
```

## Download and Install Rust

You need to download Rust perferably using `rustup`. You may need the Windows C++ build tools. Get it from here https://www.rust-lang.org/tools/install.

## Download the OpenHome source code

Visit https://github.com/andrewbenington/OpenHome/releases and download the source code zip archive from the latest release, under "Assets". Unzip the file and open the resulting folder. Hold down the Shift key and right-click on an empty space in the folder, and select "Open PowerShell window here" from the context menu. This will open a PowerShell window.

## Build and run the app

In the window that opens, run the following commands:

```powershell
npm install
npm run tauri build
```

These will take a bit. When they're finished, execute the following command to open the folder with the disk image:

```powershell
explorer.exe .\src-tauri\target\release\
```

A Windows Explorer window should open. In it you will find `OpenHome Setup x.x.x.exe` if you want to install it, or you can open `OpenHome.exe` directly from the `win-unpacked` folder. Enjoy!
