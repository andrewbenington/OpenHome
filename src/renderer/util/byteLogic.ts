export const getFlag = (dataView: DataView, offset: number, index: number) => {
  const byteIndex = offset + Math.floor(index / 8)
  const bitIndex = index % 8
  if (byteIndex < dataView.byteLength) {
    return !!((dataView.getUint8(byteIndex) >> bitIndex) & 0x1)
  }
  return false
}

export function getFlagsInRange(buffer: ArrayBuffer, offset: number, size: number) {
  const flags: number[] = []
  const dataView = new DataView(buffer)

  for (let i = 0; i < size * 8; i++) {
    if (getFlag(dataView, offset, i)) {
      flags.push(i)
    }
  }

  return flags
}
