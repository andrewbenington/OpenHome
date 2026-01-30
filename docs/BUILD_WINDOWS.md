# Building the application (Windows)

## Download and Install Node.js and npm

Node.js and the Node Package Manager (npm) will allow you to build the OpenHome application. Download the Node.js installer from the official website at https://nodejs.org/en/download/. Open the downloaded installer and run it, following the prompts and using the default configurations. After the installation is complete, open a PowerShell window by pressing the Windows key + R, typing `powershell` in the Run dialog, and pressing Enter.

Verify that Node.js and npm are installed by typing the following commands in your preferred terminal:

```powershell
node -v
npm -v
```

## Download and install pnpm

This project uses pnpm, a package manager, to install and manage module dependencies.

Compared to npm as a package manager, pnpm saves disk storage, reduces runtime and removes package redundancy by keeping a singular global store of installed packages referenced with symlinks from the project. You can visit https://pnpm.io/ for more info.

To install pnpm, run the following command in your preferred terminal:

```powershell
npm install -g pnpm@latest-10
```

## Download and Install Rust

You need to download Rust and `cargo`, preferably using `rustup`. You may need the Windows C++ build tools. Get it from here https://www.rust-lang.org/tools/install.

After installing Rust, use `cargo` to install wasm-pack:

```powershell
cargo install wasm-pack
```

## Download the OpenHome source code

Visit https://github.com/andrewbenington/OpenHome/releases and download the source code zip archive from the latest release, under "Assets". Unzip the file and open the resulting folder. Hold down the Shift key and right-click on an empty space in the folder, and select "Open PowerShell window here" from the context menu. This will open a PowerShell window.

## Build and run the app

In the window that opens, run the following commands:

```powershell
pnpm install
pnpm run tauri build
```

These will take a bit. When they're finished, execute the following command to open the folder with the disk image:

```powershell
explorer.exe .\src-tauri\target\release\
```

A Windows Explorer window should open. In it, you will find `OpenHome Setup x.x.x.exe` if you want to install it, or you can open `OpenHome.exe` directly from the `win-unpacked` folder. Enjoy!
