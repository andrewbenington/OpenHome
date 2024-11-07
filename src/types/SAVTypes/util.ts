import { PK2, PK3, PK3RR, PK4, PK5, PK6, PKM } from 'pokemon-files'
import { bytesToUint32LittleEndian, bytesToUint64LittleEndian } from '../../util/ByteLogic'
import {
  getMonFileIdentifier,
  getMonGen12Identifier,
  getMonGen345Identifier,
} from '../../util/Lookup'
import { OHPKM } from '../pkm/OHPKM'
import { SaveType } from '../types'
import { DPSAV } from './DPSAV'
import { G1SAV } from './G1SAV'
import { G2SAV } from './G2SAV'
import { G3SAV } from './G3SAV'
import { G3RRSAV } from './G3RRSAV'
import { G5SAV } from './G5SAV'
import { G6SAV } from './G6SAV'
import { HGSSSAV } from './HGSSSAV'
import { PtSAV } from './PtSAV'
import { SAV } from './SAV'
import { ParsedPath, emptyParsedPath } from './path'

const SIZE_GEN12 = 0x8000
const SIZE_GEN3 = 0x20000
const SIZE_GEN45 = 0x80000
const SIZE_XY = 0x65600
const SIZE_ORAS = 0x76000

// check if each pokemon in a save file has OpenHome data associated with it
const recoverOHPKMData = <P extends PKM>(
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

export const getSaveType = (bytes: Uint8Array): SaveType => {
  // Gen 4 saves include a size and hex "date" that can identify save type
  const validGen4DateAndSize = (offset: number) => {
    const size = bytesToUint32LittleEndian(bytes, offset - 0xc)
    if (size !== (offset & 0xffff)) return false
    const date = bytesToUint32LittleEndian(bytes, offset - 0x8)

    const DATE_INT = 0x20060623
    const DATE_KO = 0x20070903
    return date === DATE_INT || date === DATE_KO
  }
  // const validGen5Footer = (mainSize: number, infoLength: number) => {
  //   const footer = bytes.slice(mainSize - 0x100, mainSize - 0x100 + infoLength + 0x10)
  //   const stored = bytesToUint16LittleEndian(footer, 2)
  //   const actual = 0 // Checksums.CRC16_CCITT(footer[..infoLength]);
  //   return stored === actual
  // }
  if (bytes.length === SIZE_XY || bytes.length === SIZE_ORAS) {
    return SaveType.G6
  } else if (bytes.length >= SIZE_GEN45 && bytes.length <= SIZE_GEN45 + 1000) {
    if (validGen4DateAndSize(0x4c100)) {
      return SaveType.DP
    }
    if (validGen4DateAndSize(0x4cf2c)) {
      return SaveType.Pt
    }
    if (validGen4DateAndSize(0x4f628)) {
      return SaveType.HGSS
    }
    return SaveType.G5
  }
  if (bytes.length >= SIZE_GEN3 && bytes.length <= SIZE_GEN3 + 1000) {
    const valueAtAC = bytesToUint32LittleEndian(bytes, 0xac)
    switch (valueAtAC) {
      case 1:
        return SaveType.FRLG
      case 0:
        return SaveType.RS
      case 0xFF:
        return SaveType.RR
      default:
        for (let i = 0x890; i < 0xf2c; i += 4) {
          if (bytesToUint64LittleEndian(bytes, i) !== 0) return SaveType.E
        }
        return SaveType.RS
    }
  } else if (bytes.length >= SIZE_GEN12 && bytes.length <= SIZE_GEN12 + 1000) {
    // hacky
    const g2save = new G2SAV(emptyParsedPath, bytes)
    if (g2save.areCrystalInternationalChecksumsValid()) {
      return SaveType.C_I
    }
    if (g2save.areGoldSilverChecksumsValid()) {
      return SaveType.GS_I
    }
    const g1save = new G1SAV(emptyParsedPath, bytes)
    if (!g1save.invalid) {
      return SaveType.RBY_I
    }
  }
  return SaveType.UNKNOWN
}

export const buildSaveFile = (
  filePath: ParsedPath,
  fileBytes: Uint8Array,
  lookupMaps: {
    homeMonMap?: { [key: string]: OHPKM }
    gen12LookupMap?: Record<string, string>
    gen345LookupMap?: Record<string, string>
    fileCreatedDate?: Date
  }
): SAV<PKM> | undefined => {
  const { homeMonMap, gen12LookupMap, gen345LookupMap } = lookupMaps
  const saveType = getSaveType(fileBytes)
  let saveFile
  switch (saveType) {
    case SaveType.RBY_I:
      saveFile = new G1SAV(filePath, fileBytes)
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
    case SaveType.C_I:
    case SaveType.GS_I:
      saveFile = recoverOHPKMData<PK2>(
        new G2SAV(filePath, fileBytes),
        getMonGen12Identifier,
        homeMonMap,
        gen12LookupMap
      )
      return saveFile
    case SaveType.RS:
    case SaveType.FRLG:
    case SaveType.E:
      saveFile = recoverOHPKMData<PK3>(
        new G3SAV(filePath, fileBytes),
        getMonGen345Identifier,
        homeMonMap,
        gen345LookupMap
      )
      break
    case SaveType.RR:
      saveFile = recoverOHPKMData<PK3RR>(
        new G3RRSAV(filePath, fileBytes),
        getMonGen345Identifier,
        homeMonMap,
        gen345LookupMap
      )
    case SaveType.DP:
      saveFile = recoverOHPKMData<PK4>(
        new DPSAV(filePath, fileBytes),
        getMonGen345Identifier,
        homeMonMap,
        gen345LookupMap
      )
      break
    case SaveType.Pt:
      saveFile = recoverOHPKMData<PK4>(
        new PtSAV(filePath, fileBytes),
        getMonGen345Identifier,
        homeMonMap,
        gen345LookupMap
      )
      break
    case SaveType.HGSS:
      saveFile = recoverOHPKMData<PK4>(
        new HGSSSAV(filePath, fileBytes),
        getMonGen345Identifier,
        homeMonMap,
        gen345LookupMap
      )
      break
    case SaveType.G5:
      saveFile = recoverOHPKMData<PK5>(
        new G5SAV(filePath, fileBytes),
        getMonGen345Identifier,
        homeMonMap,
        gen345LookupMap
      )
      break
    case SaveType.G6:
      saveFile = recoverOHPKMData<PK6>(
        new G6SAV(filePath, fileBytes),
        getMonFileIdentifier,
        homeMonMap
      )
  }
  return saveFile
}
