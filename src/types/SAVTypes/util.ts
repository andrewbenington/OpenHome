import { PK2, PK3, PK3RR, PK4, PK5, PK6, PK7, PKM } from 'pokemon-files'
import { GameOfOrigin } from 'pokemon-resources'
import {
  bytesToUint16LittleEndian,
  bytesToUint32LittleEndian,
  bytesToUint64LittleEndian,
} from '../../util/ByteLogic'
import {
  getMonFileIdentifier,
  getMonGen12Identifier,
  getMonGen345Identifier,
} from '../../util/Lookup'
import { OHPKM } from '../pkm/OHPKM'
import { SaveType } from '../types'
import { BW2SAV } from './GEN5/BW2SAV'
import { BWSAV } from './GEN5/BWSAV'
import { DPSAV } from './GEN4/DPSAV'
import { G1SAV } from './G1SAV'
import { G2SAV } from './G2SAV'
import { G3RRSAV } from './G3RRSAV'
import { G3SAV } from './G3SAV'
import { G5SAV } from './GEN5/G5SAV'
import { HGSSSAV } from './GEN4/HGSSSAV'
import { ORASSAV } from './GEN6/ORASSAV'
import { ParsedPath, emptyParsedPath } from './path'
import { PtSAV } from './GEN4/PtSAV'
import { SAV } from './SAV'
import { SMSAV } from './GEN7/SMSAV'
import { USUMSAV } from './GEN7/USUMSAV'
import { XYSAV } from './GEN6/XYSAV'

const SIZE_GEN12 = 0x8000
const SIZE_GEN3 = 0x20000
const SIZE_GEN45 = 0x80000
const SIZE_XY = 0x65600
const SIZE_ORAS = 0x76000
export const SIZE_SM = 0x6be00
export const SIZE_USUM = 0x6cc00

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

const findFirstSaveIndexZero = (bytes: Uint8Array): number => {
  const SECTION_SIZE = 0x1000 // Each section is 4 KB
  const SAVE_INDEX_OFFSET = 0xff4 // Save index location within each section

  for (let i = 0; i < 14; i++) {
    const sectionStart = i * SECTION_SIZE
    const saveIndex = bytesToUint16LittleEndian(bytes, sectionStart + SAVE_INDEX_OFFSET)

    if (saveIndex === 0) {
      return sectionStart
    }
  }
  return 0
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
  switch (bytes.length) {
    case SIZE_XY:
      return SaveType.XY
    case SIZE_ORAS:
      return SaveType.ORAS
    case SIZE_SM:
      return SaveType.SM
    case SIZE_USUM:
      return SaveType.USUM
    default:
      if (bytes.length >= SIZE_GEN45 && bytes.length <= SIZE_GEN45 + 1000) {
        if (validGen4DateAndSize(0x4c100)) {
          return SaveType.DP
        }
        if (validGen4DateAndSize(0x4cf2c)) {
          return SaveType.Pt
        }
        if (validGen4DateAndSize(0x4f628)) {
          return SaveType.HGSS
        }
        const g5Origin = bytes[G5SAV.originOffset]
        return g5Origin <= GameOfOrigin.Black ? SaveType.BW : SaveType.BW2
      } else if (bytes.length >= SIZE_GEN3 && bytes.length <= SIZE_GEN3 + 1000) {
        const valueAtAC = bytesToUint32LittleEndian(bytes, 0xac)
        switch (valueAtAC) {
          case 1:
            return SaveType.FRLG
          case 0:
            if (bytesToUint32LittleEndian(bytes, findFirstSaveIndexZero(bytes) + 0xac)) {
              return SaveType.RR
            }
            // return SaveType.RR
            return SaveType.RS
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
  console.info('Detected save type:', saveType)
  let saveFile
  switch (saveType) {
    case SaveType.RBY_I:
      console.info('Loading Gen 1 Save File (RBY_I)')
      saveFile = new G1SAV(filePath, fileBytes)
      if (homeMonMap && gen12LookupMap) {
        saveFile.boxes.forEach((box) => {
          box.pokemon.forEach((mon, monIndex) => {
            if (!mon) return
            const gen12identifier = getMonGen12Identifier(mon)
            if (!gen12identifier) return
            const homeIdentifier = gen12LookupMap[gen12identifier]
            if (!homeIdentifier) return
            const result = Object.entries(homeMonMap).find((entry) => entry[0] === homeIdentifier)
            if (result) {
              console.info('Home mon found:', result[1])
              box.pokemon[monIndex] = result[1]
            }
          })
        })
      }
      return saveFile
    case SaveType.C_I:
    case SaveType.GS_I:
      console.info('Loading Gen 2 Save File')
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
      console.info('Loading Gen 3 Save File')
      saveFile = recoverOHPKMData<PK3>(
        new G3SAV(filePath, fileBytes),
        getMonGen345Identifier,
        homeMonMap,
        gen345LookupMap
      )
      break
    case SaveType.RR:
      console.info('Loading Radical Red Save File')
      saveFile = recoverOHPKMData<PK3RR>(
        new G3RRSAV(filePath, fileBytes),
        getMonGen345Identifier,
        homeMonMap,
        gen345LookupMap
      )
      break
    case SaveType.DP:
      console.info('Loading Gen 4 Save File (DP)')
      saveFile = recoverOHPKMData<PK4>(
        new DPSAV(filePath, fileBytes),
        getMonGen345Identifier,
        homeMonMap,
        gen345LookupMap
      )
      break
    case SaveType.Pt:
      console.info('Loading Gen 4 Save File (Pt)')
      saveFile = recoverOHPKMData<PK4>(
        new PtSAV(filePath, fileBytes),
        getMonGen345Identifier,
        homeMonMap,
        gen345LookupMap
      )
      break
    case SaveType.HGSS:
      console.info('Loading Gen 4 Save File (HGSS)')
      saveFile = recoverOHPKMData<PK4>(
        new HGSSSAV(filePath, fileBytes),
        getMonGen345Identifier,
        homeMonMap,
        gen345LookupMap
      )
      break
    case SaveType.BW:
      console.info('Loading Gen 5 Save File (BW)')
      saveFile = recoverOHPKMData<PK5>(
        new BWSAV(filePath, fileBytes),
        getMonGen345Identifier,
        homeMonMap,
        gen345LookupMap
      )
      break
    case SaveType.BW2:
      console.info('Loading Gen 5 Save File (BW2)')
      saveFile = recoverOHPKMData<PK5>(
        new BW2SAV(filePath, fileBytes),
        getMonGen345Identifier,
        homeMonMap,
        gen345LookupMap
      )
      break
    case SaveType.XY:
      console.info('Loading Gen 6 Save File (XY)')
      saveFile = recoverOHPKMData<PK6>(
        new XYSAV(filePath, fileBytes),
        getMonFileIdentifier,
        homeMonMap
      )
      break
    case SaveType.ORAS:
      console.info('Loading Gen 6 Save File (ORAS)')
      saveFile = recoverOHPKMData<PK6>(
        new ORASSAV(filePath, fileBytes),
        getMonFileIdentifier,
        homeMonMap
      )
      break
    case SaveType.SM:
      console.info('Loading Gen 7 Save File (SM)')
      saveFile = recoverOHPKMData<PK7>(
        new SMSAV(filePath, fileBytes),
        getMonFileIdentifier,
        homeMonMap
      )
      break
    case SaveType.USUM:
      console.info('Loading Gen 7 Save File (USUM)')
      saveFile = recoverOHPKMData<PK7>(
        new USUMSAV(filePath, fileBytes),
        getMonFileIdentifier,
        homeMonMap
      )
      break
  }
  console.info('Returning save file:', saveFile, 'for save type:', saveType)
  return saveFile
}

export const GameColors: Record<GameOfOrigin, string> = {
  [0]: '#666666',
  [GameOfOrigin.INVALID_6]: '#000000',
  [GameOfOrigin.INVALID_9]: '#000000',
  [GameOfOrigin.INVALID_13]: '#000000',
  [GameOfOrigin.INVALID_14]: '#000000',
  [GameOfOrigin.INVALID_16]: '#000000',
  [GameOfOrigin.INVALID_17]: '#000000',
  [GameOfOrigin.INVALID_18]: '#000000',
  [GameOfOrigin.INVALID_19]: '#000000',
  [GameOfOrigin.INVALID_28]: '#000000',
  [GameOfOrigin.INVALID_29]: '#000000',
  [GameOfOrigin.INVALID_46]: '#000000',
  [GameOfOrigin.Red]: '#DA3914',
  [GameOfOrigin.BlueGreen]: '#2E50D8',
  [GameOfOrigin.BlueJapan]: '#2E50D8',
  [GameOfOrigin.Yellow]: '#FFD733',
  [GameOfOrigin.Gold]: '#DAA520',
  [GameOfOrigin.Silver]: '#C0C0C0 ',
  [GameOfOrigin.Crystal]: '#3D51A7',
  [GameOfOrigin.Ruby]: '#CD2236',
  [GameOfOrigin.Sapphire]: '#009652',
  [GameOfOrigin.Emerald]: '#009652',
  [GameOfOrigin.ColosseumXD]: '#604E82',
  [GameOfOrigin.FireRed]: '#F15C01 ',
  [GameOfOrigin.LeafGreen]: '#9FDC00',
  [GameOfOrigin.Diamond]: '#90BEED',
  [GameOfOrigin.Pearl]: '#DD7CB1',
  [GameOfOrigin.Platinum]: '#A0A08D',
  [GameOfOrigin.HeartGold]: '#E8B502',
  [GameOfOrigin.SoulSilver]: '#AAB9CF',
  [GameOfOrigin.Black]: '#444444',
  [GameOfOrigin.White]: '#E1E1E1',
  [GameOfOrigin.Black2]: '#303E51',
  [GameOfOrigin.White2]: '#EBC5C3',
  [GameOfOrigin.X]: '#025DA6',
  [GameOfOrigin.Y]: '#EA1A3E',
  [GameOfOrigin.OmegaRuby]: '#AB2813',
  [GameOfOrigin.AlphaSapphire]: '#26649C',
  [GameOfOrigin.GO]: '#000000',
  [GameOfOrigin.Sun]: '#F1912B',
  [GameOfOrigin.Moon]: '#5599CA',
  [GameOfOrigin.UltraSun]: '#E95B2B',
  [GameOfOrigin.UltraMoon]: '#226DB5',
  [GameOfOrigin.LetsGoPikachu]: '#F5DA26',
  [GameOfOrigin.LetsGoEevee]: '#D4924B',
  [GameOfOrigin.Sword]: '#00A1E9',
  [GameOfOrigin.Shield]: '#BF004F',
  [GameOfOrigin.BrilliantDiamond]: '#44BAE5',
  [GameOfOrigin.ShiningPearl]: '#DA7D99',
  [GameOfOrigin.LegendsArceus]: '#36597B',
  [GameOfOrigin.Scarlet]: '#F34134',
  [GameOfOrigin.Violet]: '#8334B7',
}

export const ALL_SAVE_TYPES = [
  G1SAV,
  G2SAV,
  G3SAV,
  G3RRSAV,
  DPSAV,
  PtSAV,
  HGSSSAV,
  BWSAV,
  BW2SAV,
  XYSAV,
  ORASSAV,
  SMSAV,
  USUMSAV,
]

export type SupportedSave = (typeof ALL_SAVE_TYPES)[number]

export type PKMTypeOf<Type> = Type extends SAV<infer X> ? X : never
