import { OriginGame } from '@pkm-rs-resources/pkg'
import { USUM_TRANSFER_RESTRICTIONS } from 'src/consts/TransferRestrictions'
import Pk7Rust from '../../../packages/pokemon-files/src/pkm/wasm/PK7'
import { isRestricted } from '../TransferRestrictions'
import { G7SAV } from './G7SAV'
import { PathData } from './path'

const PC_OFFSET = 0x05200
const METADATA_OFFSET = 0x6cc00 - 0x200
const PC_CHECKSUM_OFFSET = METADATA_OFFSET + 0x14 + 14 * 8 + 6
const BOX_NAMES_OFFSET: number = 0x04c00
const SAVE_SIZE_BYTES = 0x6cc00

export class USUMSAV extends G7SAV {
  boxNamesOffset: number = BOX_NAMES_OFFSET
  static saveTypeID = 'USUMSAV'
  finalizationRegistry: FinalizationRegistry<string>

  constructor(path: PathData, bytes: Uint8Array) {
    super(path, bytes, PC_OFFSET, PC_CHECKSUM_OFFSET, BOX_NAMES_OFFSET)

    console.log('registering ' + this.filePath.raw)
    this.finalizationRegistry = new FinalizationRegistry((message) => {
      console.log('cleaning up: ' + message)
    })
    this.finalizationRegistry.register(this, this.filePath.raw)
  }

  supportsMon(dexNumber: number, formeNumber: number): boolean {
    return !isRestricted(USUM_TRANSFER_RESTRICTIONS, dexNumber, formeNumber)
  }

  static fileIsSave(bytes: Uint8Array): boolean {
    return bytes.length === SAVE_SIZE_BYTES
  }

  static saveTypeName = 'Pokémon Ultra Sun/Ultra Moon'

  static includesOrigin(origin: OriginGame) {
    return origin === OriginGame.UltraSun || origin === OriginGame.UltraMoon
  }

  cleanup() {
    this.boxes.forEach((box) =>
      box.pokemon.forEach((mon) => {
        if (mon instanceof Pk7Rust) {
          mon.inner.free()
        }
      })
    )
  }
}
