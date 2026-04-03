## Downloading and Installing

For quick access to downloads, visit the [downloads page](https://andrewbenington.github.io/OpenHome/download).

On **Windows**, you can also download an installer from that location, but the app will not be signed. Your operating system will give you warnings about running or even downloading the app. If you (understandably) have concerns about that, jump to the [Building App Locally](#building-app-locally) section.

**macOS** executables are signed, but will still give you a warning that they were downloaded from the internet.

### Windows

On **Windows** visit the [downloads page](https://andrewbenington.github.io/OpenHome/download) and download the app using one of the buttons at the top of the page. Unless you're using a laptop with a Snapdragon chip, you will probably want to download the x86_64 version. The Universal download will work anywhere, but it is twice as big.

If you're using Edge, go to the Privacy settings and turn off Windows Defender SmartScreen. Once the file is downloaded, make sure to turn it back on.

### Linux

You can download an rpm, deb, or AppImage file from the [downloads page](https://andrewbenington.github.io/OpenHome/download) depending on your architecture and distribution.

### macOS

As of April 2026, I sign macOS releases with my Apple Developer license, so these instructions are unnecessary. If I don't renew my license, this will be necessary again, so I'm leaving the instructions here.

#### macOS unsigned binaries

On **macOS** visit the [downloads page](https://andrewbenington.github.io/OpenHome/download), and download the latest release using one of the buttons at the top of th page. If you don't know whether you have an Intel or an Apple Silicon Mac, go to  > About This Mac and check whether your Chip is Apple or Intel.

Follow the instructions to move the application to your Applications folder if you'd like. If you run the app by double clicking, it will give you a security error. To bypass this, do the following:

**macOS Sequoia/Tahoe**

macOS Sequoia and future versions make it painstaking to run an app not signed with an Apple certificate (which requires an expensive yearly subscription). Assuming you installed the app in your root Applications folder, you can get around this by running the following in Terminal:

```bash
xattr -cr /Applications/OpenHome.app
```

After you do this you should be able to run the app as normal.

**Older Versions of macOS**

You will only get a security error if you try and open the app by double clicking. You can get around this if you ctrl + click the app, select "Open", and the click "Open" again. You should be able to open it by double clicking after you do this.
