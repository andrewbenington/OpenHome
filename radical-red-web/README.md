# Radical Red Save Editor (Web)

A standalone web-based save file editor specifically for **Pokémon Radical Red**. This application allows you to view and edit your Radical Red save files directly in your browser with a clean wireframe interface.

![Wireframe Design](https://img.shields.io/badge/Design-Wireframe-black?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?style=flat-square)
![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square)

## Features

- 📂 **Load .sav files** - Import your Radical Red save file directly from your device
- 👀 **View all 18 boxes** - Browse through all your Pokémon across all boxes
- ✏️ **Edit Pokémon data**:
  - Stats (HP, Attack, Defense, Sp. Atk, Sp. Def, Speed)
  - IVs (Individual Values) - 0-31 for each stat
  - EVs (Effort Values) - 0-255 for each stat
  - Moves (by move ID)
  - Nickname (up to 10 characters)
  - Nature
  - Ability slot
  - Friendship (0-255)
  - Experience points
  - Held item
  - Ball type
  - Shiny status (experimental)
- ⚠️ **Fakemon detection** - Identifies and prevents editing of fanmade Pokémon
- 💾 **Download modified save** - Export your edited save file
- 🔒 **Safe editing** - Automatic checksum recalculation ensures save file integrity

## Limitations

- **Move and item names** are shown as numeric IDs (refer to Radical Red documentation for mappings)
- **Pokémon sprites** are not displayed (only Dex# and level)
- **Base stats lookup** is simplified (stats shown are calculated but may not be 100% accurate for all species)
- **Shiny editing** may not work correctly due to personality value mechanics
- **Only Radical Red saves** are supported (detection based on CFRU format and security key)

## Setup

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- npm (comes with Node.js)

### Installation

1. Navigate to the project directory:
   ```bash
   cd radical-red-web
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to the URL shown in the terminal (usually `http://localhost:5173`)

## Building for Production

To create a production build:

```bash
npm run build
```

This will generate optimized files in the `dist/` directory. You can then:

- Serve the `dist/` folder with any static file server
- Deploy to platforms like Vercel, Netlify, GitHub Pages, etc.

To preview the production build locally:

```bash
npm run preview
```

## Usage

### 1. Load Your Save File

Click **"Choose .sav File"** and select your Radical Red save file from your device. The file should have a `.sav` extension.

**Note:** The application checks if the file is a valid Radical Red save. If you see an error, ensure you're loading:
- A Radical Red save file (not vanilla Fire Red or other ROM hacks)
- A save file with the correct format (128KB or 128KB + 16 bytes)

### 2. Browse Boxes

Use the **Box Selector** buttons to switch between boxes 1-18. Each box displays up to 30 Pokémon in a 6x5 grid.

- **Empty slots** are shown with a dash (—)
- **Occupied slots** show the Pokémon's Dex number, level, and nickname
- **Fakemon** are highlighted with a red border and cannot be transferred (but can be viewed)

### 3. Edit a Pokémon

Click on any Pokémon to open the detail modal. The modal has three tabs:

#### **STATS Tab**
- View base stats (HP, Attack, Defense, etc.)
- Edit IVs (Individual Values) for each stat (0-31)
- Edit EVs (Effort Values) for each stat (0-255)

#### **MOVES Tab**
- Edit the four moves by their move ID
- Refer to [Radical Red documentation](https://docs.google.com/spreadsheets/d/1uGUm0bTqwjVn5Gx7KqYHIHKHqKl0ZiK0F7b3SqTJRjk/edit) for move ID mappings

#### **OTHER Tab**
- Edit nickname (max 10 characters)
- Edit friendship (0-255)
- Edit experience points
- Change nature (dropdown list)
- Change ability slot (Ability 1, Ability 2, or Hidden Ability)
- Edit ball type (by ball ID)
- Edit held item (by item ID)
- Toggle shiny status (experimental - may not work correctly)

### 4. Save Changes

After editing, click **"SAVE CHANGES"** in the modal. The application tracks all modified Pokémon.

### 5. Download Modified Save

When you're done editing, click **"DOWNLOAD MODIFIED .SAV"** at the top of the page. This will:
- Recalculate all checksums automatically
- Generate a new save file named `[original]_modified.sav`
- Download it to your device

### 6. Test Your Save

**Important:** Before replacing your original save file:
1. Backup your original `.sav` file
2. Test the modified save in your emulator
3. Verify that your changes worked correctly
4. If everything works, you can replace the original

## Technical Details

### Save File Format

Radical Red uses the **CFRU (Complete Fire Red Upgrade)** save format:
- 14 sectors of 4KB each (56KB total)
- Dual save system (two copies for backup)
- Pokémon stored as 58-byte structures
- Each box holds 30 Pokémon
- Checksums per sector

### File Structure

```
radical-red-web/
├── src/
│   ├── components/          # React components
│   │   ├── BoxViewer.tsx
│   │   ├── FileUpload.tsx
│   │   └── PokemonDetailModal.tsx
│   ├── lib/                 # Core parsing logic
│   │   ├── byteLogic.ts     # Byte manipulation utilities
│   │   ├── pokemonParser.ts # Parse/serialize Pokémon (58 bytes)
│   │   ├── saveParser.ts    # Parse/serialize save file
│   │   ├── stringConversion.ts # Gen 3 string encoding
│   │   └── types.ts         # TypeScript interfaces
│   ├── styles/
│   │   └── global.css       # Wireframe styling
│   ├── App.tsx              # Main application
│   └── main.tsx             # Entry point
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Troubleshooting

### "This does not appear to be a valid Radical Red save file"

**Solutions:**
- Ensure you're loading a Radical Red save (not vanilla Fire Red, Emerald, or other hacks)
- Check that the file size is correct (128KB or 128KB+16)
- Try re-dumping your save file from your emulator

### Changes don't appear in-game

**Solutions:**
- Make sure you downloaded the modified save file
- Replace the original save file in your emulator's save directory
- Some emulators cache save data - try closing and reopening the emulator
- Verify that checksums were recalculated (the app does this automatically)

### Pokémon appears as "Egg" or corrupted

**Possible causes:**
- Setting invalid move IDs
- Setting IVs/EVs outside valid ranges (0-31 for IVs, 0-255 for EVs)
- Corrupted original save file

**Solutions:**
- Restore from your backup
- Use valid ranges for all edited values
- Avoid editing critical data like species ID or personality value (not exposed in UI)

### Move names not showing

This is expected - the app shows move IDs instead of names. Refer to online resources for Radical Red move ID mappings.

## Future Improvements

Potential enhancements:
- [ ] Add move name lookup table
- [ ] Add item name lookup table
- [ ] Add Pokémon species name lookup
- [ ] Display Pokémon sprites
- [ ] Add base stats lookup per species
- [ ] Support for other ROM hacks (Unbound, Emerald Kaizo, etc.)
- [ ] Batch editing (edit multiple Pokémon at once)
- [ ] Import/export individual Pokémon
- [ ] Ribbon/mark editing

## Contributing

This is a standalone project. Feel free to fork and modify for your own use.

## Disclaimer

This tool is for educational and personal use only. Always:
- **Back up your save files** before editing
- Test modified saves before committing to them
- Use at your own risk

This tool is not affiliated with the Pokémon Company, Nintendo, Game Freak, or the Radical Red development team.

## License

This project is provided as-is for personal use. The original OpenHome project it's based on has its own license.

## Credits

- **OpenHome project** - For the save parsing reference implementation
- **Radical Red team** - For the amazing ROM hack
- **CFRU (Complete Fire Red Upgrade)** - For the save format documentation
