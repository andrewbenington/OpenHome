import { app } from 'electron';
import fs from 'fs';
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
  lookupFileString.split('\n').forEach((entry) => {
    const [lookupString, monRef] = entry.split(',');
    lookupMap[lookupString] = monRef;
  });
  return lookupMap;
}

function registerLookup(fileName: string, lookupsToAdd: string) {
  const appDataPath = app.getPath('appData');
  const lookupMap: { [key: string]: string } = {};
  if (fs.existsSync(`${appDataPath}/OpenHome/storage/lookup/${fileName}`)) {
    const lookupString = fs
      .readFileSync(`${appDataPath}/OpenHome/storage/lookup/${fileName}`)
      .toString();
    lookupString.split('\n').forEach((entry) => {
      const [lookupIdentifier, monRef] = entry.split(',');
      lookupMap[lookupIdentifier] = monRef;
    });
  }
  lookupsToAdd.split('\n').forEach((entry) => {
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
