<p>
  OpenHome uses <a href="https://electron.atom.io/">Electron</a>, <a href="https://facebook.github.io/react/">React</a>, <a href="https://webpack.js.org/">Webpack</a> and <a href="https://www.npmjs.com/package/react-refresh">React Fast Refresh</a>.
</p>

# OpenHome

OpenHome is an open source tool for moving Pokémon between games losslessly, much like Pokémon Home on the Nintendo Switch. Unlike Pokémon Home, OpenHome also allows for moving Pokémon to past generations from future ones. When a Pokémon is moved into a save file, its data from other games is saved locally, so nothing is lost when transferring to past generations. For example, you can move your Kalos Champion Sceptile from Pokémon X to Pokémon Ruby, earn it the Artist Ribbon, and it will have both the Kalos Champion and Artist ribbons when moved back to Pokémon X.

## Screenshots

<img width="1000" alt="Screenshot 2024-01-14 at 1 47 47 PM" src="https://github.com/andrewbenington/OpenHome/assets/42848290/45b3bc85-d305-4429-8082-f540d9c87053">
<img width="200" alt="Screenshot 2024-01-14 at 1 23 54 PM" src="https://github.com/andrewbenington/OpenHome/assets/42848290/e4480130-0dac-46fb-809a-e9a4b1c77777">
<img width="200" alt="Screenshot 2024-01-14 at 1 53 02 PM" src="https://github.com/andrewbenington/OpenHome/assets/42848290/cd834651-d59e-4ae0-9e8b-85e7ac833edd">
<img width="200" alt="Screenshot 2024-01-14 at 1 53 55 PM" src="https://github.com/andrewbenington/OpenHome/assets/42848290/4fb3ce94-909c-42c6-a5c6-138ce6e345a5">
<img width="200" alt="Screenshot 2024-01-14 at 1 24 18 PM" src="https://github.com/andrewbenington/OpenHome/assets/42848290/5c568c3c-3c09-410e-a1e3-f9407a60c50b">
<img width="200" alt="Screenshot 2024-01-14 at 1 24 39 PM" src="https://github.com/andrewbenington/OpenHome/assets/42848290/d9de03a5-41ae-41e5-baba-876e7bac461e">
<img width="200" alt="Screenshot 2024-01-14 at 1 25 22 PM" src="https://github.com/andrewbenington/OpenHome/assets/42848290/992ddb5f-2c6d-45e9-9b99-83c3f644e7a8">

## Downloading and Installing

On **Linux**, you can either download the rpm, deb, or AppImage file from the [latest release](https://github.com/andrewbenington/OpenHome/releases) depending on your architecture and distribution.

On **Windows** and **macOS**, you can also download an installer from that location, but the app will not be signed. Your operating system will give you warnings about running or even downloading the app. If you (understandably) have concerns about that, jump to the [Building App Locally](#building-app-locally) section.

On **macOS** visit the [latest release](https://github.com/andrewbenington/OpenHome/releases), and download and open OpenHome-x.x.x-macos-x64.dmg (for Intel Macs) or OpenHome-x.x.x-macos-arm64.dmg (for Apple Silicon Macs). If you don't know whether you have an Intel Mac or an Apple Silicon Mac, go to  > About This Mac and check whether your Chip is Apple or Intel.

Follow the instructions to move the application to your Applications folder if you'd like. If you run the app by double clicking, it will give you a security error. To bypass this, ctrl + click the app, select "Open", and the click "Open" again.

On **Windows** visit the [latest release](https://github.com/andrewbenington/OpenHome/releases) and download and open OpenHome-Setup-x.x.x.exe. If you're using Edge, go to the Privacy settings and turn off Windows Defender SmartScreen. Once the file is downloaded, make sure to turn it back on.

## Building App Locally

If you don't want to bypass your security restrictions to download the app, you can instead download the source code and build the app locally. Follow these instructions:

For [Windows](./docs/BUILD_WINDOWS.md)

For [macOS](./docs/BUILD_MAC.md)

## Moving Between Saves

This video is from an old version; The concept is the same but I'm too lazy to remake it.

[![Demo Video](https://img.youtube.com/vi/s8MoLsySvOw/hqdefault.jpg)](https://youtu.be/s8MoLsySvOw)

The extra Champion Ribbon in Emerald, 0hp in Blue, and HeartGold/SoulSilver save misidentification are all bugs that have been fixed in the latest version.

## Current Support

Development is ongoing. While OpenHome does its best to convert Pokemon between
formats losslessly, there are sometimes mistakes. It's always a good idea to back up
your save files. If you come across a bug, create an [issue](https://github.com/andrewbenington/OpenHome/issues) to bring it to my attention.

All PKM formats from Generations I-IX are currently supported, including from Pokémon
Colosseum and Pokémon XD. All game save files from Generations I-VI (Red/Blue through
OmegaRuby/AlphaSapphire) are supported, except for the Japanese versions of Pokémon
Red/Green/Blue/Yellow. Support for Generation VII (3DS) is coming soon.

### Supported PKM import formats

- PK1
- PK2
- PK3
- PK4
- PK5
- PK6
- PK7
- PA8
- COLOPKM
- XDPKM
- PB7
- PK8
- PB8
- PK9

### Supported save file formats

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
- Pokémon X/Y
- Pokémon Omega Ruby/Alpha Sapphire

## Alterations to transferred Pokémon

When moving Pokémon to an older game, some compromises have to be made. OpenHome will
try its best to preserve aspects of a Pokémon such as its nature, ability, gender, and
shininess, all of which are usually possible minus some specific cases in the GameBoy
games. These compromises will be reverted when moving back to a future game.

For example, a Pokémon originating in Generation VI being moved into a Generation III
game will have its personality value altered to preserve its nature, ability (if
possible), gender, and shininess.

A Pokémon transferred into Generation I or II will have it's Original Trainer's ID
changed to a "tracking number" of sorts due to the lack of a Personality Value in
those games.

## Credits

This application would not have been possible without the research done at https://projectpokemon.org/, the work done by the [PKHeX](https://github.com/kwsch/PKHeX) developers, and the sprites archived by https://pokemondb.net/ and https://www.bulbagarden.net/.
