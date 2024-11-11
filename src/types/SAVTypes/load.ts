import { PK3, PK4, PK5, PK6, PK7, PKM } from 'pokemon-files'
import {
  getMonFileIdentifier,
  getMonGen12Identifier,
  getMonGen345Identifier,
} from '../../util/Lookup'
import { OHPKM } from '../pkm/OHPKM'
import { PKMFile } from '../pkm/util'
import { BW2SAV } from './BW2SAV'
import { BWSAV } from './BWSAV'
import { DPSAV } from './DPSAV'
import { G1SAV } from './G1SAV'
import { G2SAV } from './G2SAV'
import { G3SAV } from './G3SAV'
import { HGSSSAV } from './HGSSSAV'
import { ORASSAV } from './ORASSAV'
import { ParsedPath } from './path'
import { PtSAV } from './PtSAV'
import { SAV } from './SAV'
import { SMSAV } from './SMSAV'
import { USUMSAV } from './USUMSAV'
import { SAVClass } from './util'
import { XYSAV } from './XYSAV'

// check if each pokemon in a save file has OpenHome data associated with it
const recoverOHPKMData = <P extends PKMFile>(
  saveFile: SAV<P>,
  getIdentifier: (_: P) => string | undefined,
  homeMonMap?: { [key: string]: OHPKM },
  lookupMap?: { [key: string]: string }
) => {
  if (!homeMonMap || !getIdentifier) {
    return saveFile
  }
  saveFile.boxes.forEach((box) => {
    box.pokemon.forEach((mon, monIndex) => {
      if (mon) {
        const lookupIdentifier = getIdentifier(mon as P)
        if (!lookupIdentifier) return
        const homeIdentifier = lookupMap ? lookupMap[lookupIdentifier] : lookupIdentifier
        if (!homeIdentifier) return
        const result = Object.entries(homeMonMap).find((entry) => entry[0] === homeIdentifier)
        if (result) {
          const updatedOHPKM = result[1]
          updatedOHPKM.updateData(mon)
          window.electron.ipcRenderer.send('write-ohpkm', updatedOHPKM.bytes)
          box.pokemon[monIndex] = updatedOHPKM
        }
      }
    })
  })
  return saveFile
}

export const getSaveType = (
  bytes: Uint8Array,
  supportedSaveTypes: SAVClass[]
): SAVClass | undefined => {
  for (const saveType of supportedSaveTypes) {
    if (saveType.fileIsSave(bytes)) {
      return saveType
    }
  }
  return undefined
}

export const buildSaveFile = (
  filePath: ParsedPath,
  fileBytes: Uint8Array,
  lookupMaps: {
    homeMonMap?: { [key: string]: OHPKM }
    gen12LookupMap?: Record<string, string>
    gen345LookupMap?: Record<string, string>
    fileCreatedDate?: Date
  },
  supportedSaveTypes: SAVClass[]
): SAV<PKM> | undefined => {
  const { homeMonMap, gen12LookupMap, gen345LookupMap } = lookupMaps
  const saveType = getSaveType(fileBytes, supportedSaveTypes)
  let saveFile
  switch (saveType) {
    case G1SAV:
      saveFile = new saveType(filePath, fileBytes)
      if (homeMonMap && gen12LookupMap) {
        saveFile.boxes.forEach((box) => {
          box.pokemon.forEach((mon, monIndex) => {
            if (!mon) return
            // GameBoy PKM files don't have a personality value to track the mons with OpenHome data,
            // so they need to be identified with their IVs and OT
            const gen12identifier = getMonGen12Identifier(mon)
            if (!gen12identifier) return
            const homeIdentifier = gen12LookupMap[gen12identifier]
            if (!homeIdentifier) return
            const result = Object.entries(homeMonMap).find((entry) => entry[0] === homeIdentifier)
            if (result) {
              console.info('home mon found:', result[1])
              box.pokemon[monIndex] = result[1]
            }
          })
        })
      }
      return saveFile
    case G2SAV:
      console.info('Loading Gen 2 Save File')
      saveFile = recoverOHPKMData(
        new saveType(filePath, fileBytes),
        getMonGen12Identifier,
        homeMonMap,
        gen12LookupMap
      )
      return saveFile
    case G3SAV:
      console.info('Loading Gen 3 Save File')
      saveFile = recoverOHPKMData<PK3>(
        new G3SAV(filePath, fileBytes),
        getMonGen345Identifier,
        homeMonMap,
        gen345LookupMap
      )
      break
    case DPSAV:
      console.info('Loading Gen 4 Save File (DP)')
      saveFile = recoverOHPKMData<PK4>(
        new DPSAV(filePath, fileBytes),
        getMonGen345Identifier,
        homeMonMap,
        gen345LookupMap
      )
      break
    case PtSAV:
      console.info('Loading Gen 4 Save File (Pt)')
      saveFile = recoverOHPKMData<PK4>(
        new PtSAV(filePath, fileBytes),
        getMonGen345Identifier,
        homeMonMap,
        gen345LookupMap
      )
      break
    case HGSSSAV:
      console.info('Loading Gen 4 Save File (HGSS)')
      saveFile = recoverOHPKMData<PK4>(
        new HGSSSAV(filePath, fileBytes),
        getMonGen345Identifier,
        homeMonMap,
        gen345LookupMap
      )
      break
    case BWSAV:
      console.info('Loading Gen 5 Save File (BW)')
      saveFile = recoverOHPKMData<PK5>(
        new BWSAV(filePath, fileBytes),
        getMonGen345Identifier,
        homeMonMap,
        gen345LookupMap
      )
      break
    case BW2SAV:
      console.info('Loading Gen 5 Save File (BW2)')
      saveFile = recoverOHPKMData<PK5>(
        new BW2SAV(filePath, fileBytes),
        getMonGen345Identifier,
        homeMonMap,
        gen345LookupMap
      )
      break
    case XYSAV:
      console.info('Loading Gen 6 Save File (XY)')
      saveFile = recoverOHPKMData<PK6>(
        new XYSAV(filePath, fileBytes),
        getMonFileIdentifier,
        homeMonMap
      )
      break
    case ORASSAV:
      console.info('Loading Gen 6 Save File (ORAS)')
      saveFile = recoverOHPKMData<PK6>(
        new ORASSAV(filePath, fileBytes),
        getMonFileIdentifier,
        homeMonMap
      )
      break
    case SMSAV:
      console.info('Loading Gen 7 Save File (SM)')
      saveFile = recoverOHPKMData<PK7>(
        new SMSAV(filePath, fileBytes),
        getMonFileIdentifier,
        homeMonMap
      )
      break
    case USUMSAV:
      console.info('Loading Gen 7 Save File (USUM)')
      saveFile = recoverOHPKMData<PK7>(
        new USUMSAV(filePath, fileBytes),
        getMonFileIdentifier,
        homeMonMap
      )
      break
  }
  return saveFile
}
