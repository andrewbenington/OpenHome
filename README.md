<p>
  OpenHome uses <a href="https://electron.atom.io/">Electron</a>, <a href="https://facebook.github.io/react/">React</a>, <a href="https://webpack.js.org/">Webpack</a> and <a href="https://www.npmjs.com/package/react-refresh">React Fast Refresh</a>.
</p>

# OpenHome
OpenHome is an open source tool for moving Pokémon between games losslessly, much like Pokémon Home on the Nintendo Switch. Unlike Pokémon Home, OpenHome allows for moving pokémon to past generations from future ones. All pokémon data is saved in OpenHome, so nothing is lost when transferring to past generations.

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

#### Partially supported PKM import formats
Importing these formats may be lossy when it comes to more obscure aspects of the original pokemon. Development is ongoing.

- COLOPKM
- XDPKM
- PK7
- PB7
- PK8
- PA8
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

#### Copy only
These save files can be opened and pokemon can be copied into OpenHome or another supported save, but the original save file itself is not modified.
Any mon dropped brought in will be lost, and any mon brought out will essentially be duplicated.
- Pokémon Black/White
- Pokémon Black 2/White 2
  
## Alterations to transferred pokémon
For this to work, some compromises have to be made. OpenHome will try its best to preserve aspects of a pokémon such as its nature, ability, gender, and shininess, all of which are possible minus some extreme cases in the GameBoy games. 

For example, a pokémon originating in Generation 6 being moved into a Generation 3 game will have its personality value altered to preserve its nature, ability (if possible), gender, and shininess.

A pokémon transferred into Generation 1 or 2 will have it's Original Trainer's ID changed to a "tracking number" of sorts
