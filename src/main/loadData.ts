import { app } from 'electron';
import fs from 'fs';
import { SaveRef, SaveType } from '../types/types';
import { readBytesFromFile } from './fileHandlers';

export function loadOHPKMs() {
  const appDataPath = app.getPath('appData');
  const files = fs.readdirSync(`${appDataPath}/OpenHome/storage/mons`);
  const monMap: { [key: string]: Uint8Array } = {};
  files.forEach((file) => {
    if (file.endsWith('.ohpkm')) {
      const bytes = readBytesFromFile(
        `${appDataPath}/OpenHome/storage/mons/${file}`
      );
      if (bytes) {
        monMap[file.slice(0, file.length - 6)] = bytes;
      }
    }
  });
  return monMap;
}

export function loadGen12Lookup() {
  return loadLookup('gen12Lookup.csv');
}

export function registerGen12Lookup(lookupsToAdd: string) {
  registerLookup('gen12Lookup.csv', lookupsToAdd);
}

export function loadGen34Lookup() {
  return loadLookup('gen34Lookup.csv');
}

export function registerGen34Lookup(lookupsToAdd: string) {
  registerLookup('gen34Lookup.csv', lookupsToAdd);
}

export function loadLookup(fileName: string) {
  const appDataPath = app.getPath('appData');
  const lookupMap: { [key: string]: string } = {};
  const lookupFileString = fs
    .readFileSync(`${appDataPath}/OpenHome/storage/lookup/${fileName}`)
    .toString();
  lookupFileString.split(/\r?\n/).forEach((entry) => {
    const [lookupString, monRef] = entry.split(',');
    if (lookupString && monRef) {
      lookupMap[lookupString] = monRef;
    }
  });
  console.log(lookupMap);
  return lookupMap;
}

function registerLookup(fileName: string, lookupsToAdd: string) {
  const appDataPath = app.getPath('appData');
  const lookupMap: { [key: string]: string } = {};
  if (fs.existsSync(`${appDataPath}/OpenHome/storage/lookup/${fileName}`)) {
    const lookupString = fs
      .readFileSync(`${appDataPath}/OpenHome/storage/lookup/${fileName}`)
      .toString();
    lookupString.split(/\r?\n/).forEach((entry) => {
      const [lookupIdentifier, monRef] = entry.split(',');
      lookupMap[lookupIdentifier] = monRef;
    });
  }
  lookupsToAdd.split(/\r?\n/).forEach((entry) => {
    const [lookupIdentifier, monRef] = entry.split(',');
    lookupMap[lookupIdentifier] = monRef;
  });
  const newLookupString = Object.entries(lookupMap)
    .map(([lookupIdentifier, homeIdentifier], i) => {
      return lookupIdentifier + ',' + homeIdentifier + '\n';
    })
    .join('');
  console.log('writing', fileName);
  fs.writeFileSync(
    `${appDataPath}/OpenHome/storage/lookup/${fileName}`,
    newLookupString
  );
}

export function loadSaveRefs() {
  const appDataPath = app.getPath('appData');
  const saveRefMap: { [key: string]: SaveRef } = {};
  const lookupFileString = fs
    .readFileSync(`${appDataPath}/OpenHome/storage/saveFiles.csv`)
    .toString();
  lookupFileString.split(/\r?\n/).forEach((entry) => {
    const [filePath, saveTypeString, game, trainerName, trainerID] =
      entry.split(',');
    const saveType = SaveTypeStrings[saveTypeString];
    if (filePath && saveType) {
      saveRefMap[filePath] = {
        filePath,
        saveType,
        game,
        trainerName,
        trainerID,
      };
    }
  });
  console.log(saveRefMap);
  return saveRefMap;
}

export function addSaveRef(save: SaveRef) {
  const appDataPath = app.getPath('appData');
  const saveRefMap = loadSaveRefs();
  saveRefMap[save.filePath] = save;
  const newLookupString = Object.values(saveRefMap)
    .map((saveRef, i) => {
      return `${saveRef.filePath},${SaveType[saveRef.saveType]},${
        saveRef.game ?? ''
      },${saveRef.trainerName},${saveRef.trainerID}\n`;
    })
    .join('');
  fs.writeFileSync(
    `${appDataPath}/OpenHome/storage/saveFiles.csv`,
    newLookupString
  );
}

const SaveTypeStrings: { [key: string]: SaveType } = {
  RGBY_J: SaveType.RGBY_J,
  RBY_I: SaveType.RBY_I,
  GS_J: SaveType.GS_J,
  GS_I: SaveType.GS_I,
  C_J: SaveType.C_J,
  C_I: SaveType.C_I,
  RS: SaveType.RS,
  FRLG: SaveType.FRLG,
  E: SaveType.E,
  DP: SaveType.DP,
  Pt: SaveType.Pt,
  HGSS: SaveType.HGSS,
};
