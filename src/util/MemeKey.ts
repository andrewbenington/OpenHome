import CryptoJS from 'crypto-js'

export const SIGNATURE_LENGTH = 0x60
const AES_CHUNK_LENGTH = 0x10

function wordArrayToUint8Array(wordArray: CryptoJS.lib.WordArray): Uint8Array {
  const words = wordArray.words
  const sigBytes = wordArray.sigBytes
  const result = new Uint8Array(sigBytes)
  for (let i = 0; i < sigBytes; i++) {
    result[i] = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff
  }
  return result
}

function uint8ArrayToWordArray(u8arr: Uint8Array): CryptoJS.lib.WordArray {
  const words = []
  for (let i = 0; i < u8arr.length; i += 4) {
    words.push((u8arr[i] << 24) | (u8arr[i + 1] << 16) | (u8arr[i + 2] << 8) | u8arr[i + 3])
  }
  return CryptoJS.lib.WordArray.create(words, u8arr.length)
}

export class MemeKey {
  private DER: Uint8Array
  private privateKey: bigint
  private publicKey: bigint
  private mod: bigint

  constructor(bytes: Uint8Array) {
    this.DER = bytes
    this.mod = bytesToBigIntBE(bytes.slice(0x18, 0x79))
    this.publicKey = bytesToBigIntBE(bytes.slice(0x7b, 0x7e))
    this.privateKey = bytesToBigIntBE(signingKey)
  }

  public AesEncrypt(data: Uint8Array) {
    const payload = data.slice(0, data.length - SIGNATURE_LENGTH)
    const signature = data.slice(data.length - SIGNATURE_LENGTH)

    // GetAesImp in PKHeX
    const key = this.GetAesKey(payload)
    const keyWordArray = uint8ArrayToWordArray(key)

    // Initialize AES-128-ECB cipher
    const cipher = CryptoJS.algo.AES.createEncryptor(keyWordArray, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.NoPadding,
    })

    // AesDecrypt(data, sig) in PKHeX
    let nextXor: Uint8Array = new Uint8Array(AES_CHUNK_LENGTH)

    for (let i = 0; i < signature.length; i += AES_CHUNK_LENGTH) {
      let slice: Uint8Array = signature.slice(i, i + AES_CHUNK_LENGTH)
      slice = xorBytes(slice, nextXor)

      const encryptedSliceWordArray = cipher.process(uint8ArrayToWordArray(slice))
      const encryptedSlice = wordArrayToUint8Array(encryptedSliceWordArray)

      nextXor = new Uint8Array(encryptedSlice)
      signature.set(nextXor, i)
    }

    nextXor = xorBytes(nextXor, signature.slice(0, AES_CHUNK_LENGTH))
    const subKey = this.GetSubKey(nextXor)

    for (let i = 0; i < signature.length; i += AES_CHUNK_LENGTH) {
      const xorResult = xorBytes(signature.slice(i, i + AES_CHUNK_LENGTH), subKey)
      signature.set(xorResult, i)
    }

    nextXor = new Uint8Array(AES_CHUNK_LENGTH)
    for (let i = signature.length - AES_CHUNK_LENGTH; i >= 0; i -= AES_CHUNK_LENGTH) {
      const temp = signature.slice(i, i + AES_CHUNK_LENGTH)

      const encryptedSliceWordArray = cipher.process(uint8ArrayToWordArray(temp))
      const encryptedSlice = wordArrayToUint8Array(encryptedSliceWordArray)

      signature.set(xorBytes(new Uint8Array(encryptedSlice), nextXor), i)
      nextXor = temp
    }

    const encrypted = new Uint8Array(data.length)
    encrypted.set(payload, 0)
    encrypted.set(signature, data.length - SIGNATURE_LENGTH)
    return encrypted
  }

  public GetAesKey(bytes: Uint8Array) {
    const payload = new Uint8Array(this.DER.length + bytes.length)
    payload.set(this.DER, 0)
    payload.set(bytes, this.DER.length)

    return sha1Digest(payload).subarray(0, AES_CHUNK_LENGTH)
  }

  public GetSubKey(temp: Uint8Array): Uint8Array {
    const subKey = new Uint8Array(AES_CHUNK_LENGTH)
    for (let i = 0; i < temp.length; i += 2) {
      const b1 = temp[i]
      const b2 = temp[i + 1]

      subKey[i] = truncByte(2 * b1 + truncByte(b2 >> 7))
      subKey[i + 1] = truncByte(2 * b2)

      if (i + 2 < temp.length) {
        subKey[i + 1] = truncByte(subKey[i + 1] + truncByte(temp[i + 2] >> 7))
      }
    }

    if ((temp[0] & 0x80) != 0) {
      subKey[0xf] ^= 0x87
    }

    return subKey
  }

  public RSAPublic(data: Uint8Array) {
    const M = bytesToBigIntBE(data)
    const result = modPow(M, this.publicKey, this.mod)
    return bigIntToBytesBE(result)
  }

  public RSAPrivate(data: Uint8Array) {
    const M = bytesToBigIntBE(data)
    const result = modPow(M, this.privateKey, this.mod)
    return bigIntToBytesBE(result)
  }
}

export const pokedexAndSaveFileMemeKey = new Uint8Array([
  0x30, 0x7c, 0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05,
  0x00, 0x03, 0x6b, 0x00, 0x30, 0x68, 0x02, 0x61, 0x00, 0xb6, 0x1e, 0x19, 0x20, 0x91, 0xf9, 0x0a,
  0x8f, 0x76, 0xa6, 0xea, 0xaa, 0x9a, 0x3c, 0xe5, 0x8c, 0x86, 0x3f, 0x39, 0xae, 0x25, 0x3f, 0x03,
  0x78, 0x16, 0xf5, 0x97, 0x58, 0x54, 0xe0, 0x7a, 0x9a, 0x45, 0x66, 0x01, 0xe7, 0xc9, 0x4c, 0x29,
  0x75, 0x9f, 0xe1, 0x55, 0xc0, 0x64, 0xed, 0xdf, 0xa1, 0x11, 0x44, 0x3f, 0x81, 0xef, 0x1a, 0x42,
  0x8c, 0xf6, 0xcd, 0x32, 0xf9, 0xda, 0xc9, 0xd4, 0x8e, 0x94, 0xcf, 0xb3, 0xf6, 0x90, 0x12, 0x0e,
  0x8e, 0x6b, 0x91, 0x11, 0xad, 0xda, 0xf1, 0x1e, 0x7c, 0x96, 0x20, 0x8c, 0x37, 0xc0, 0x14, 0x3f,
  0xf2, 0xbf, 0x3d, 0x7e, 0x83, 0x11, 0x41, 0xa9, 0x73, 0x02, 0x03, 0x01, 0x00, 0x01,
])

const signingKey = new Uint8Array([
  0x00, 0x77, 0x54, 0x55, 0x66, 0x8f, 0xff, 0x3c, 0xba, 0x30, 0x26, 0xc2, 0xd0, 0xb2, 0x6b, 0x80,
  0x85, 0x89, 0x59, 0x58, 0x34, 0x11, 0x57, 0xae, 0xb0, 0x3b, 0x6b, 0x04, 0x95, 0xee, 0x57, 0x80,
  0x3e, 0x21, 0x86, 0xeb, 0x6c, 0xb2, 0xeb, 0x62, 0xa7, 0x1d, 0xf1, 0x8a, 0x3c, 0x9c, 0x65, 0x79,
  0x07, 0x76, 0x70, 0x96, 0x1b, 0x3a, 0x61, 0x02, 0xda, 0xbe, 0x5a, 0x19, 0x4a, 0xb5, 0x8c, 0x32,
  0x50, 0xae, 0xd5, 0x97, 0xfc, 0x78, 0x97, 0x8a, 0x32, 0x6d, 0xb1, 0xd7, 0xb2, 0x8d, 0xcc, 0xcb,
  0x2a, 0x3e, 0x01, 0x4e, 0xdb, 0xd3, 0x97, 0xad, 0x33, 0xb8, 0xf2, 0x8c, 0xd5, 0x25, 0x05, 0x42,
  0x51,
])

function truncByte(val: number): number {
  return val & 0xff
}

function bytesToBigIntBE(bytes: Uint8Array) {
  let result = 0n
  for (const byte of bytes) {
    result = (result << 8n) | BigInt(byte)
  }
  return result
}
function bigIntToBytesBE(value: bigint): Uint8Array {
  // Calculate the number of bytes needed to represent the bigint
  const byteLength = (value.toString(2).length + 7) >> 3 // Equivalent to Math.ceil(value.toString(2).length / 8)
  const byteArray = new Uint8Array(byteLength)

  // Fill the byte array with the bytes of the bigint in big-endian order
  for (let i = byteLength - 1; i >= 0; i--) {
    byteArray[i] = Number(value & 0xffn) // Extract the least significant byte
    value >>= 8n // Shift right by 8 bits (1 byte)
  }

  return byteArray
}

function xorBytes(b1: Uint8Array, b2: Uint8Array): Uint8Array {
  const result = new Uint8Array(b1.length)
  for (let i = 0; i < result.length; i++) {
    result[i] = b1[i] ^ b2[i]
  }
  return result
}

function modPow(base: bigint, exponent: bigint, modulus: bigint): bigint {
  if (modulus <= 0n) {
    throw new Error('Modulus must be greater than 0')
  }

  let result = 1n // Initialize result to 1
  base = base % modulus // Handle cases where base is greater than modulus

  while (exponent > 0n) {
    // If exponent is odd, multiply base with result
    if (exponent % 2n === 1n) {
      result = (result * base) % modulus
    }

    // exponent = exponent / 2
    exponent = exponent >> 1n // Equivalent to exponent / 2

    // base = base * base % modulus
    base = (base * base) % modulus
  }

  return result
}

function sha1Digest(data: Uint8Array) {
  const payloadWords = CryptoJS.lib.WordArray.create(data)
  const shasum = CryptoJS.SHA1(payloadWords)
  return wordArrayToUint8Array(shasum)
}
