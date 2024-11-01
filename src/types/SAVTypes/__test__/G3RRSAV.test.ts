import { readFileSync } from 'fs';
import { resolve } from 'path';
import { G3RRSAV } from '../G3RRSAV';
import { ParsedPath } from '../path';

describe('G3SAV - Radical Red Save Tests', () => {
  let radicalRedSave: G3RRSAV;
  let saveBytes: Uint8Array;

  beforeAll(() => {
    const savePath = resolve(__dirname, './SAVFILES/radicalred.sav');
    saveBytes = new Uint8Array(readFileSync(savePath));
    
    const parsedPath: ParsedPath = {
      raw: './SAVFILES/radicalred.sav',
      base: '.SAVFILES/radical red.sav',
      name: 'radical red',
      dir: './SAVFILES',
      ext: '.sav',
      root: '/',
      separator: '/'
    };

    radicalRedSave = new G3RRSAV(parsedPath, saveBytes);
  });

  test('should load initial save data correctly', () => {
    expect(radicalRedSave.name).toBe('Radical');
  });

  test('should print the first Pokémon in the first box', () => {
    const firstBox = radicalRedSave.boxes[0];  // Access the first box
    const firstPokemon = firstBox.pokemon[0];  // Access the first Pokémon in the box

    if (firstPokemon) {
      console.log('First Pokémon in first box:', {
        nickname: firstPokemon.nickname,
        // level: firstPokemon.level,
        trainerName: firstPokemon.trainerName,
        // trainerID: firstPokemon.trainerID,
        heldItemIndex: firstPokemon.heldItemIndex,
        languageIndex: firstPokemon.languageIndex,
        dexNum: firstPokemon.dexNum
      });

      console.log(firstBox.pokemon[1]?.nickname)
      
      // Optionally, add assertions to check properties if known
      expect(firstPokemon).toBeDefined();
      expect(firstPokemon.nickname).toBe("Von");
      expect(firstPokemon.trainerID).toBe(10334);
      expect(firstPokemon.trainerName).toBe("Radical")

      expect(firstBox.pokemon[1].nickname).toBe("Pint");
      expect(firstBox.pokemon[1].trainerName).toBe("Radical")

    } else {
      console.log('No Pokémon found in the first box.');
    }
  });
});
