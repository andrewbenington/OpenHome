export function addMissingFunctions() {
  if (!Uint8Array.prototype.toHex) {
    Uint8Array.prototype.toHex = function () {
      return Array.from(this)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
    }
  }

  if (!Uint8Array.fromHex) {
    Uint8Array.fromHex = function (hex: string) {
      const bytes = new Uint8Array(hex.length / 2)
      for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16)
      }
      return bytes
    }
  }

  if (!Uint8Array.fromBase64) {
    Uint8Array.fromBase64 = function (str) {
      // Strip ASCII whitespace (per spec)
      const cleaned = str.replace(/[\t\n\f\r ]/g, '')
      const binary = atob(cleaned)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
      }
      return bytes
    }
  }
}
