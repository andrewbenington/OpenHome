# Building the application (Linux)

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
