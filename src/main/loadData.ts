import fs from 'fs';
import { app } from 'electron';
import OHPKM from '../types/PKM/OHPKM';
import { readBytesFromFile } from './fileHandlers';
import { getMonFileIdentifier, getMonGen12Identifier } from '../types/PKM/util';

export function loadOHPKMs() {
  const appDataPath = app.getPath('appData');
  const files = fs.readdirSync(`${appDataPath}/open-home/storage/mons`);
  const monMap: { [key: string]: Uint8Array } = {};
  files.forEach((file) => {
    if (file.endsWith('.ohpkm')) {
      const bytes = readBytesFromFile(
        `${appDataPath}/open-home/storage/mons/${file}`
      );
      if (bytes) {
        monMap[file.slice(0, file.length - 6)] = bytes;
      }
    }
  });
  return monMap;
}

export function loadGen12Lookup() {
  const appDataPath = app.getPath('appData');
  const lookupMap: { [key: string]: string } = {};
  const lookupString = fs
    .readFileSync(`${appDataPath}/open-home/storage/lookup/gen12Lookup.csv`)
    .toString();
  lookupString.split('\n').forEach((entry) => {
    const [gen12String, monRef] = entry.split(',');
    lookupMap[gen12String] = monRef;
  });
  return lookupMap;
}

export function registerGen12Lookup(lookupsToAdd: string) {
  const appDataPath = app.getPath('appData');
  const lookupMap: { [key: string]: string } = {};
  if (
    fs.existsSync(`${appDataPath}/open-home/storage/lookup/gen12Lookup.csv`)
  ) {
    const lookupString = fs
      .readFileSync(`${appDataPath}/open-home/storage/lookup/gen12Lookup.csv`)
      .toString();
    lookupString.split('\n').forEach((entry) => {
      const [gen12String, monRef] = entry.split(',');
      lookupMap[gen12String] = monRef;
    });
  }
  lookupsToAdd.split('\n').forEach((entry) => {
    const [gen12String, monRef] = entry.split(',');
    lookupMap[gen12String] = monRef;
  });
  const newLookupString = Object.entries(lookupMap)
    .map(([gen12Identifier, homeIdentifier], i) => {
      return gen12Identifier + ',' + homeIdentifier + '\n';
    })
    .join('');
  console.log(
    'writing',
    `${appDataPath}/open-home/storage/lookup/gen12Lookup.csv`
  );
  console.log(newLookupString);
  fs.writeFileSync(
    `${appDataPath}/open-home/storage/lookup/gen12Lookup.csv`,
    newLookupString
  );
}
