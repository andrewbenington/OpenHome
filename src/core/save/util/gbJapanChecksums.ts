import { xorChecksum8BitLe } from '@openhome-core/util/byteLogic'

/**
 * Checksum helpers for Japanese Gen 1/2 saves.
 *
 * Japanese Gen 1 uses a single 8-bit additive-complement checksum over the
 * main data region (0x2598-0x3593 inclusive) stored at 0x3594. Unlike
 * international saves, the box banks at 0x4000/0x6000 carry no checksums at
 * all (the bytes following the box data are unwritten 0xFF).
 *
 * Japanese Gen 2 uses a 16-bit little-endian additive checksum over the
 * trainer data region starting at 0x2009, stored at 0x2D0D with a second
 * copy at 0x7F0D. The covered range differs between Gold/Silver (through
 * 0x2C8B) and Crystal (through 0x2AE2). On save, the game also mirrors the
 * trainer data region to 0x7209.
 */

export const G1_JP_CHECKSUM_START = 0x2598
export const G1_JP_CHECKSUM_END = 0x3593 // inclusive
export const G1_JP_CHECKSUM_OFFSET = 0x3594

export const G2_JP_CHECKSUM_START = 0x2009
export const G2_JP_CHECKSUM_END_GS = 0x2c8b // inclusive
export const G2_JP_CHECKSUM_END_CRYSTAL = 0x2ae2 // inclusive
export const G2_JP_CHECKSUM_OFFSET = 0x2d0d
export const G2_JP_CHECKSUM_OFFSET_2 = 0x7f0d
export const G2_JP_BACKUP_OFFSET = 0x7209

export function getGen1JapanChecksum(bytes: Uint8Array): number {
  return xorChecksum8BitLe(bytes, G1_JP_CHECKSUM_START, G1_JP_CHECKSUM_END) ^ 0xff
}

export function isGen1JapanChecksumValid(bytes: Uint8Array): boolean {
  return getGen1JapanChecksum(bytes) === bytes[G1_JP_CHECKSUM_OFFSET]
}

const G1_JP_PARTY_OFFSET = 0x2ed5

/**
 * A Japanese Gen 1 save must have a valid main checksum AND a plausible party
 * list. The second condition guards against degenerate checksum collisions:
 * an international save whose Japanese checksum region is mostly zeroes can
 * accidentally "validate" (complement of a 0xFF sum against a 0x00 byte).
 */
export function looksLikeGen1JapanSave(bytes: Uint8Array): boolean {
  if (!isGen1JapanChecksumValid(bytes)) {
    return false
  }
  const partyCount = bytes[G1_JP_PARTY_OFFSET]

  if (partyCount < 1 || partyCount > 6) {
    return false
  }
  return partyCount === 6 || bytes[G1_JP_PARTY_OFFSET + 1 + partyCount] === 0xff
}

function sumChecksum16(bytes: Uint8Array, start: number, endInclusive: number): number {
  let checksum = 0

  for (let i = start; i <= endInclusive; i++) {
    checksum = (checksum + bytes[i]) & 0xffff
  }
  return checksum
}

export function getGen2JapanChecksum(bytes: Uint8Array, endInclusive: number): number {
  return sumChecksum16(bytes, G2_JP_CHECKSUM_START, endInclusive)
}

function areGen2JapanChecksumsValid(bytes: Uint8Array, endInclusive: number): boolean {
  const checksum = getGen2JapanChecksum(bytes, endInclusive)

  if (checksum === 0) return false
  const stored1 = bytes[G2_JP_CHECKSUM_OFFSET] | (bytes[G2_JP_CHECKSUM_OFFSET + 1] << 8)
  const stored2 = bytes[G2_JP_CHECKSUM_OFFSET_2] | (bytes[G2_JP_CHECKSUM_OFFSET_2 + 1] << 8)

  return checksum === stored1 && checksum === stored2
}

export function areGen2JapanGoldSilverChecksumsValid(bytes: Uint8Array): boolean {
  return areGen2JapanChecksumsValid(bytes, G2_JP_CHECKSUM_END_GS)
}

export function areGen2JapanCrystalChecksumsValid(bytes: Uint8Array): boolean {
  return areGen2JapanChecksumsValid(bytes, G2_JP_CHECKSUM_END_CRYSTAL)
}
