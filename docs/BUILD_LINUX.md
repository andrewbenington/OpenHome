# Building the application (Linux)

## Install Tauri‐specific system dependencies

Depending on your distro, install the required packages so Tauri can build properly. See Tauri’s prerequisites.

Here are examples for the most common distros:

```bash
# Debian / Ubuntu / other Debian-based
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev

# Arch
sudo pacman -Syu
sudo pacman -S --needed webkit2gtk-4.1 base-devel curl wget file openssl appmenu-gtk-module libappindicator-gtk3 librsvg

# Fedora / RHEL
sudo dnf check-update
sudo dnf install webkit2gtk4.1-devel openssl-devel curl wget file libappindicator-gtk3-devel librsvg2-devel
sudo dnf group install "C Development Tools and Libraries"
```

If you use another distro, check the [Tauri docs](https://v2.tauri.app/start/prerequisites/#linux) for the appropriate equivalent.

## Install Node.js and npm

Node.js and npm are required to build the OpenHome application. Install them using your package manager. For example, on Ubuntu or Debian-based systems, run:
```bash
sudo apt install nodejs npm
```

Verify that Node.js and npm are installed by running:
```bash
node -v  
npm -v
``` 

If the versions are too old, consider using Node Version Manager (nvm) to install a newer version:
```bash
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh | bash
```
Then restart your terminal and run:  
```bash
nvm install --lts
```

## Install Rust

Install Rust using rustup (recommended):
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh  
```

Follow the prompts to complete the installation, then restart your terminal and verify the installation: 
```bash
rustc --version
```

## Download the OpenHome source code

Visit https://github.com/andrewbenington/OpenHome/releases and download the source code zip archive from the latest release under "Assets." Extract the file, then open a terminal in the extracted folder.  

Alternatively, you can clone the repository using Git:
```bash
git clone https://github.com/andrewbenington/OpenHome.git  
cd OpenHome
```  

## Build the app

This project provides a Makefile to simplify building. From the root of the project, you can build an AppImage by running:  
```bash
make build-appimage
```

If you only want to run the app in development mode without creating a package, run:  
```bash
make start
```

For Steam Deck users, there is also a helper script that automates building:  
`./makesteamdeck.sh`

## Run the built app

If you used `make build-appimage`, navigate to the release directory:
```bash
cd src-tauri/target/release/
```

Then run the AppImage:  
```bash
./OpenHome_x86_64.AppImage  
```

If you used `make start`, the app should launch automatically in development mode.  

Enjoy!
