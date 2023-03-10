import { PK4 } from '../types/PKM/PK4';
import { PKM } from '../types/PKM/PKM';
import { getBaseMon } from '../types/PKM/util';
import OHPKM from '../types/PKM/OHPKM';
import { bytesToString } from './ByteLogic';

export const getMonFileIdentifier = (mon: OHPKM) => {
  if (mon.personalityValue) {
    const baseMon = getBaseMon(mon.dexNum, mon.formNum);
    if (baseMon) {
      return `${baseMon.dexNumber.toString().padStart(4, '0')}-${bytesToString(
        mon.trainerID,
        2
      ).concat(bytesToString(mon.secretID, 2))}-${bytesToString(
        mon.personalityValue,
        4
      )}-${bytesToString(mon.gameOfOrigin, 1)}`;
    }
  }
  return undefined;
};

export const getMonGen12Identifier = (mon: PKM) => {
  const { dvs } = mon;
  if (!dvs) return undefined;
  const baseMon = getBaseMon(mon.dexNum, mon.formNum);
  const TID =
    mon.isGameBoyOrigin || mon.personalityValue === undefined
      ? mon.trainerID
      : mon.personalityValue % 0x10000;
  if (baseMon) {
    return `${baseMon.dexNumber.toString().padStart(4, '0')}-${bytesToString(
      TID,
      2
    )}-${mon.trainerName}-${dvs.atk.toString(16)}-${dvs.def.toString(
      16
    )}-${dvs.spc.toString(16)}-${dvs.spe.toString(16)}`;
  }
};

export const getMonGen34Identifier = (mon: PKM) => {
  let pk34 = mon;
  if (mon instanceof OHPKM) {
    pk34 = new PK4(mon);
  }
  const baseMon = getBaseMon(pk34.dexNum, pk34.formNum);
  if (baseMon) {
    return `${baseMon.dexNumber.toString().padStart(4, '0')}-${bytesToString(
      pk34.trainerID,
      2
    ).concat(bytesToString(pk34.secretID, 2))}-${bytesToString(
      pk34.personalityValue!!,
      4
    )}`;
  }
  return undefined;
};

export const updateGen12LookupTable = (updatedMons: OHPKM[]) => {
  const gen12LookupString = updatedMons
    .map((mon, i) => {
      if (!mon) return '';
      const gen12Identifier = getMonGen12Identifier(mon);
      const homeIdentifier = getMonFileIdentifier(mon);
      console.log(gen12Identifier, homeIdentifier);
      if (!gen12Identifier || !homeIdentifier) return '';
      return gen12Identifier + ',' + homeIdentifier + '\n';
    })
    .join('');
  window.electron.ipcRenderer.sendMessage(
    'write-gen12-lookup',
    gen12LookupString
  );
};

export const updateGen34LookupTable = (updatedMons: OHPKM[]) => {
  const gen34LookupString = updatedMons
    .map((mon, i) => {
      if (!mon) return '';
      const gen34Identifier = getMonGen34Identifier(mon);
      const homeIdentifier = getMonFileIdentifier(mon);
      console.log(gen34Identifier, homeIdentifier);
      if (!gen34Identifier || !homeIdentifier) return '';
      return gen34Identifier + ',' + homeIdentifier + '\n';
    })
    .join('');
  window.electron.ipcRenderer.sendMessage(
    'write-gen34-lookup',
    gen34LookupString
  );
};
