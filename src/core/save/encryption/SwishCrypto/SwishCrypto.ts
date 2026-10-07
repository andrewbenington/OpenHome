import {
  ArrayBlock,
  Block,
  BlockData,
  blockDataType,
  BlockType,
  BoolType,
  decryptBlocks,
  encryptBlocks,
  hashIsValid,
  NumericBlock,
  NumericType,
  ObjectBlock,
  ScalarType,
  swishCryptoHash,
} from '@pkm-rs/pkg'

const SIZE_HASH = 0x20

function decrypt(data: Uint8Array): Block[] {
  return decryptBlocks(data)
}

function encrypt(blocks: Block[], size: number): Uint8Array {
  return encryptBlocks(blocks, size)
}

export const SwishCrypto = {
  SIZE_HASH,
  computeHash: swishCryptoHash,
  getIsHashValid: hashIsValid,
  decrypt,
  encrypt,
}

export function blockIsType<T extends BlockType>(
  block: Block,
  checkedType: T
): block is { key: number; data: BlockDataFor<T> } {
  return blockDataIsType(block.data, checkedType)
}

export function blockDataIsType<T extends BlockType>(
  blockData: BlockData,
  checkedType: T
): blockData is BlockDataFor<T> {
  const blockType = blockDataType(blockData)
  if (blockType === 'Array' || blockType === 'Object') {
    return blockType === checkedType
  }

  if (typeof checkedType === 'string') return false

  if ('Bool' in blockType.Scalar) {
    return 'Bool' in checkedType.Scalar && checkedType.Scalar.Bool === blockType.Scalar.Bool
  } else {
    return (
      'Numeric' in checkedType.Scalar && checkedType.Scalar.Numeric === blockType.Scalar.Numeric
    )
  }
}

type KeysOfUnion<T> = T extends any ? keyof T : never

type DataType = KeysOfUnion<BlockData>

type DataOf<K extends DataType> = Extract<BlockData, Record<K, any>>[K]

type BlockDataOf<K extends DataType> = Record<K, DataOf<K>>

// Distributes over the NumericBlock union: { UInt8: number } -> "UInt8"
type NumericTypeOf<V> = V extends unknown ? Extract<keyof V, NumericType> : never

export type BlockTypeOf<D extends BlockData> = D extends { Bool: infer B extends BoolType }
  ? { Scalar: { Bool: B } }
  : D extends { Object: unknown }
    ? 'Object'
    : D extends { Array: unknown }
      ? 'Array'
      : D extends { Value: infer V extends NumericBlock }
        ? { Scalar: { Numeric: NumericTypeOf<V> } }
        : never

type NumericBlockFor<N extends NumericType> = Extract<NumericBlock, Record<N, unknown>>

type ScalarData<S extends ScalarType> = S extends { Bool: infer B }
  ? { Bool: B }
  : S extends { Numeric: infer N extends NumericType }
    ? { Value: NumericBlockFor<N> }
    : never

export type BlockDataFor<T extends BlockType> = T extends 'Object'
  ? { Object: ObjectBlock }
  : T extends 'Array'
    ? { Array: ArrayBlock }
    : T extends { Scalar: infer S extends ScalarType }
      ? ScalarData<S>
      : never
