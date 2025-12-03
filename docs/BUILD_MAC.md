# Building the application (macOS)

Open the Terminal application. Is is located in the Utilities folder, under Applications.

## Install Homebrew

Homebrew is a package manager for macOS, and it streamlines the process of installing packages. Paste and execute the following command in Terminal:

```zsh
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

This may take a few minutes.

## Install Node.js and npm

Node.js and pnpm will allow you to build the OpenHome application. Execute the following commands to install them:

```zsh
brew install node
curl -fsSL https://get.pnpm.io/install.sh | sh -

```

Once that has finished, verify the installation was successful by running these commands:

```zsh
node -v
pnpm -v
```

## Download the OpenHome source code

Visit https://github.com/andrewbenington/OpenHome/releases and download the source code zip archive from the latest release, under "Assets". Unzip the file. Right-click (or ctrl + click) the resulting folder and click "New Terminal at folder". This should open a Terminal window starting in that folder.

## Build and run the app

In the window that opens, run the following commands:

```zsh
pnpm install
npm run package
```

These will take a bit. When they're finished, execute the following command to open the folder with the disk image:

Apple Silicon (Most Macs since 2020):

```zsh
open ./src-tauri/target/aarch64-apple-darwin/release/bundle/dmg/
```

Intel (Most Macs before 2020):

```zsh
open ./src-tauri/target/x86_64-apple-darwin/release/bundle/dmg/
```

A Finder window should open, and in it will be multiple files including two disk images. Open `OpenHome-x.x.x-arm64.dmg` if you have an Apple Silicon Mac, otherwise open `OpenHome-x.x.x.dmg`. Drag the app to the Applications folder, and now you can open it!
