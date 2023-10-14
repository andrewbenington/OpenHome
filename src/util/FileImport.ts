import {
  COLOPKM,
  OHPKM,
  PA8,
  PB7,
  PK1,
  PK2,
  PK3,
  PK4,
  PK5,
  PK6,
  PK7,
  PK8,
  PK9,
  PKM,
  XDPKM,
} from '../types/PKMTypes'

export const acceptableExtensions = [
  'OHPKM',
  'PKM',
  'PK1',
  'PK2',
  'COLOPKM',
  'XDPKM',
  'PK5',
  'PK6',
  'PK7',
  'PB7',
  'PK8',
  'PA8',
  'PB8',
  'PK9',
]

export const bytesToPKM = (bytes: Uint8Array, extension: string): PKM => {
  if (extension === 'OHPKM') {
    return new OHPKM(bytes)
  }
  if (bytes.length === 69 || extension === 'PK1') {
    return new PK1(bytes.slice(3, bytes.length))
  }
  if (bytes.length === 73 || extension === 'PK2') {
    return new PK2(bytes.slice(3, bytes.length))
  }
  if (extension === 'COLOPKM') {
    return new COLOPKM(bytes)
  }
  if (extension === 'XDPKM') {
    return new XDPKM(bytes)
  }
  if (extension === 'PK3' || bytes.length === 100 || bytes.length === 80) {
    return new PK3(bytes)
  }
  if (bytes[0x5f] < 20 && (extension === 'PK4' || bytes.length === 136 || bytes.length === 236)) {
    return new PK4(bytes)
  }
  if (
    extension === 'PK5' ||
    bytes.length === 0xdc ||
    bytes.length === 0x88 ||
    bytes.length === 136
  ) {
    return new PK5(bytes)
  }
  if (extension === 'PK6') {
    return new PK6(bytes)
  }
  if (extension === 'PK7') {
    return new PK7(bytes)
  }
  if (extension === 'PB7') {
    return new PB7(bytes)
  }
  if (extension === 'PK8' || extension === 'PB8') {
    return new PK8(bytes, extension === 'PB8' ? 'PB8' : 'PK8')
  }
  if (extension === 'PA8') {
    return new PA8(bytes)
  }
  return new PK9(bytes)
}
