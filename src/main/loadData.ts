import { app } from 'electron';
import fs from 'fs';
import {
  SaveRef,
  SaveRefMap,
  SaveType,
  StringToStringMap,
} from '../types/types';
import { readBytesFromFile } from './fileHandlers';
import path from 'path';

export function loadOHPKMs() {
  const appDataPath = app.getPath('appData');
  const files = fs.readdirSync(path.join(appDataPath, "OpenHome", "storage", "mons"));
  const monMap: { [key: string]: Uint8Array } = {};
  files.forEach((file) => {
    if (file.endsWith('.ohpkm')) {
      const bytes = readBytesFromFile(
        path.join(appDataPath, "OpenHome", "storage", "mons", file)
      );
      if (bytes) {
        monMap[file.slice(0, file.length - 6)] = bytes;
      }
    }
  });
  return monMap;
}

export function loadLookup(fileName: string) {
  const appDataPath = app.getPath('appData');
  const lookupMap: { [key: string]: string } = {};
  const lookupFileString = fs
    .readFileSync(path.join(appDataPath, "OpenHome", "storage", "lookup", fileName))
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

function writeLookup(fileName: string, lookupMap: StringToStringMap) {
  const appDataPath = app.getPath('appData');
  const newCSVString = Object.entries(lookupMap)
    .map(([lookupIdentifier, homeIdentifier], i) => {
      return lookupIdentifier + ',' + homeIdentifier + '\n';
    })
    .join('');
  console.log('writing', fileName);
  fs.writeFileSync(
    path.join(appDataPath, "OpenHome", "storage", "lookup", fileName),
    newCSVString
  );
}

export function loadGen12Lookup() {
  return loadLookup('gen12Lookup.csv');
}

export function registerGen12Lookup(lookupMap: StringToStringMap) {
  writeLookup('gen12Lookup.csv', lookupMap);
}

export function loadGen345Lookup() {
  return loadLookup('gen345Lookup.csv');
}

export function registerGen345Lookup(lookupMap: StringToStringMap) {
  writeLookup('gen345Lookup.csv', lookupMap);
}

export function loadRecentSaves() {
  const appDataPath = app.getPath('appData');
  const recentSaves: SaveRefMap = {};
  const lookupFileString = fs
    .readFileSync(path.join(appDataPath, "OpenHome", "storage", "saveFiles.csv"))
    .toString();
  lookupFileString.split(/\r?\n/).forEach((entry) => {
    let [filePath, saveTypeString, game, trainerName, trainerID, lastOpened] =
      entry.split(',');
    filePath = decodeURIComponent(filePath);
    const saveType = SaveTypeStrings[saveTypeString];
    if (filePath && saveType) {
      recentSaves[filePath] = {
        filePath,
        saveType,
        game,
        trainerName,
        trainerID,
        lastOpened: parseInt(lastOpened)
      };
    }
  });
  return recentSaves;
}

function writeRecentSaves(recentSaves: SaveRefMap) {
  const appDataPath = app.getPath('appData');
  const newCSVString = Object.values(recentSaves)
    .map((saveRef, i) => {
      return `${encodeURIComponent(saveRef.filePath)},${
        SaveType[saveRef.saveType]
      },${saveRef.game ?? ''},${saveRef.trainerName},${saveRef.trainerID},${
        saveRef.lastOpened ?? Date.now()
      }\n`;
    })
    .join('');
  fs.writeFileSync(
    path.join(appDataPath, "OpenHome", "storage", "saveFiles.csv"),
    newCSVString
  );
}

export function addRecentSave(save: SaveRef) {
  const saveRefMap = loadRecentSaves();
  saveRefMap[save.filePath] = save;
  writeRecentSaves(saveRefMap);
}

export function removeRecentSave(filePath: string) {
  const saveRefMap = loadRecentSaves();
  delete saveRefMap[encodeURIComponent(filePath)];
  writeRecentSaves(saveRefMap);
}

export function loadImage(image: string) {
  const filePath = path.join(app.getAppPath(), 'images', 'sprites', 'gen4', 'abomasnow.png')
  return new URL(`file://${filePath}`).toString()
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
  G5: SaveType.G5,
};
