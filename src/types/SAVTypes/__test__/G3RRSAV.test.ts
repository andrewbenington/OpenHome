import { readFileSync } from 'fs';
import { resolve } from 'path';
import { G3RRSAV } from '../G3RRSAV';
import { ParsedPath } from '../path';
import { PK3RR } from '../../../../../pokemon-files-js/src';
import { OHPKM } from '../../pkm/OHPKM';

function display_mon(mon: PK3RR | OHPKM) {
  console.log('Boxmon:', {
    nickname: mon.nickname,
    // level: firstPokemon.level,
    trainerName: mon.trainerName,
    // trainerID: firstPokemon.trainerID,
    heldItemIndex: mon.heldItemIndex,
    languageIndex: mon.languageIndex,
    dexNum: mon.dexNum,
    moves: mon.moves,
    gameOfOrigin: mon.gameOfOrigin,
  });
}

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
    const firstPokemon = radicalRedSave.boxes[0].pokemon[0];

    if (firstPokemon) {

      display_mon(firstPokemon);
      
      expect(firstPokemon.nickname).toBe("Von");
      expect(firstPokemon.trainerID).toBe(10334);
      expect(firstPokemon.trainerName).toBe("Radical")
      expect(firstPokemon.moves[0]).toBe(33); // Tackle
      expect(firstPokemon.moves[1]).toBe(336); // Howl
      expect(firstPokemon.dexNum).toBe(261);
    } else {
      console.log('No Pokémon found in the first box, first slot.');
    }

    const secondPokemon = radicalRedSave.boxes[1].pokemon[1];

    if (secondPokemon) {
      display_mon(secondPokemon)

      expect(secondPokemon.nickname).toBe("Cin");
      expect(secondPokemon.trainerID).toBe(10334);
      expect(secondPokemon.trainerName).toBe("Radical")
    } else {
      console.log('No Pokémon found in the second box, second slot.');
    }

    const sevii_lokix = radicalRedSave.boxes[0].pokemon[3];

    if (sevii_lokix) {
      display_mon(sevii_lokix)

      expect(sevii_lokix.nickname).toBe("Lokix");
      expect(sevii_lokix.trainerID).toBe(10334);
      expect(sevii_lokix.trainerName).toBe("Radical")
    } else {
      console.log('Sevii Lokix not found.');
    }

    const lastpokemon = radicalRedSave.boxes[0].pokemon[29];

    if (lastpokemon) {
      display_mon(lastpokemon)

      expect(lastpokemon.nickname).toBe("Crabrawler");
      expect(lastpokemon.trainerID).toBe(10334);
      expect(lastpokemon.trainerName).toBe("Radical")
    } else {
      console.log('No Pokémon found in the second box, second slot.');
    }
  });
});
