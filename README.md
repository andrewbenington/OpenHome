<p>
  OpenHome uses <a href="https://electron.atom.io/">Electron</a>, <a href="https://facebook.github.io/react/">React</a>, <a href="https://webpack.js.org/">Webpack</a> and <a href="https://www.npmjs.com/package/react-refresh">React Fast Refresh</a>.
</p>

# OpenHome

OpenHome is an open source tool for moving Pokémon between games losslessly, much like Pokémon Home on the Nintendo Switch. Unlike Pokémon Home, OpenHome allows for moving pokémon to past generations from future ones. All pokémon data is saved in OpenHome, so nothing is lost when transferring to past generations.

## Downloading and Installing

On Linux, download OpenHome-x.x.x.AppImage from the [latest release](https://github.com/andrewbenington/OpenHome/releases). This should work out of the box.

On Windows and MacOS, you can also download an installer from that location, but the app will not be signed. Your operating system will give you warnings about running or even downloading the app. If you (understandably) have concerns about that, jump to the [Building App Locally](#building-app-locally) section.

On MacOS visit the [latest release](https://github.com/andrewbenington/OpenHome/releases), and download and open OpenHome-x.x.x.dmg (for Intel Macs) or OpenHome-x.x.x-arm64.dmg (for Apple Silicon Macs).
Follow the instructions to move the application to your Applications folder if you'd like. If you run the app by double clicking, it will give you a security error. To bypass this, ctrl + click the app, select "Open", and the click "Open" again.

On Windows visit the [latest release](https://github.com/andrewbenington/OpenHome/releases) and download and open OpenHome-Setup-x.x.x.exe. If you're using Edge, go to the Privacy settings and turn off Windows Defender SmartScreen. Once the file is downloaded, make sure to turn it back on.

## Building App Locally

If you don't want to bypass your security restrictions to download the app, you can instead download the source code and build the app locally. Follow these instructions:

For [Windows](./docs/BUILD_WINDOWS.md)

For [MacOS](./docs/BUILD_MAC.md)

## Moving Between Saves

[![Demo Video](https://img.youtube.com/vi/s8MoLsySvOw/hqdefault.jpg)](https://youtu.be/s8MoLsySvOw)

The extra Champion Ribbon in Emerald is a debugging oversight. The 0hp in Blue is a known bug, as is the fact that it thinks the HeartGold save is SoulSilver.

## Current Support

### Importing PKMs

#### Fully supported PKM import formats

- PK1
- PK2
- PK3
- PK4
- PK5
- PK6
- PK7
- PA8

#### Partially supported PKM import formats

Importing these formats may be lossy when it comes to more obscure aspects of the original pokemon. Development is ongoing.

- COLOPKM
- XDPKM
- PB7
- PK8
- PB8
- PK9

### Save files

#### Fully supported OpenHome functionality

- Pokémon Red/Blue/Yellow (international)
- Pokémon Gold/Silver (international)
- Pokémon Crystal (international)
- Pokémon Ruby/Sapphire
- Pokémon Emerald
- Pokémon FireRed/LeafGreen
- Pokémon Diamond/Pearl
- Pokémon Platinum
- Pokémon HeartGold/SoulSilver
- Pokémon Black/White
- Pokémon Black 2/White 2

## Alterations to transferred pokémon

For this to work, some compromises have to be made. OpenHome will try its best to preserve aspects of a pokémon such as its nature, ability, gender, and shininess, all of which are possible minus some extreme cases in the GameBoy games.

For example, a pokémon originating in Generation 6 being moved into a Generation 3 game will have its personality value altered to preserve its nature, ability (if possible), gender, and shininess.

A pokémon transferred into Generation 1 or 2 will have it's Original Trainer's ID changed to a "tracking number" of sorts

## Credits

This application would not have been possible without the research done at https://projectpokemon.org/, the work done by the [PKHeX](https://github.com/kwsch/PKHeX) developers, or the sprites archived by https://pokemondb.net/.
