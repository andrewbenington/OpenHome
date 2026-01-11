export function doNecessaryPolyfills() {
  // remove this after node 25 is lts
  if (!('fromBase64' in Uint8Array)) {
    // @ts-expect-error – intentionally adding this static constructor because it is relatively new to javascript
    Uint8Array.fromBase64 = function (base64: string): Uint8Array {
      const binary = atob(base64)
      const len = binary.length
      const bytes = new Uint8Array(len)

      for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i)
      }

      return bytes
    }
  }

  // remove this after node 22 is lts
  if (!Set.prototype.difference) {
    Set.prototype.difference = function (other) {
      const r = new Set()
      for (const v of this) if (!other.has(v)) r.add(v)
      return r
    }
  }

  // remove this after node 22 is lts
  if (!Set.prototype.intersection) {
    Set.prototype.intersection = function (other) {
      const r = new Set()
      for (const v of this) if (other.has(v)) r.add(v)
      return r
    }
  }
}
