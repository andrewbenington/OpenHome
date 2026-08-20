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

  if (!Array.prototype.toSorted) {
    Array.prototype.toSorted = function <T>(this: T[], compareFn?: (a: T, b: T) => number): T[] {
      return [...this].sort(compareFn)
    }
  }

  if (!Array.prototype.toReversed) {
    Array.prototype.toReversed = function <T>(this: T[]): T[] {
      return [...this].reverse()
    }
  }

  if (!Object.groupBy) {
    Object.groupBy = function <K extends PropertyKey, T>(
      items: Iterable<T>,
      keySelector: (item: T, index: number) => K
    ): Partial<Record<K, T[]>> {
      const result: Partial<Record<K, T[]>> = {}
      let index = 0
      for (const item of items) {
        const key = keySelector(item, index++)
        ;(result[key] ??= []).push(item)
      }
      return result
    }
  }

  if (!Set.prototype.union) {
    Set.prototype.union = function <T, U>(this: Set<T>, other: ReadonlySetLike<U>): Set<T | U> {
      const result = new Set<T | U>(this)
      const keys = other.keys()
      for (let step = keys.next(); !step.done; step = keys.next()) {
        result.add(step.value)
      }
      return result
    }
  }

  if (!Set.prototype.intersection) {
    Set.prototype.intersection = function <T, U>(
      this: Set<T>,
      other: ReadonlySetLike<U>
    ): Set<T & U> {
      const result = new Set<T & U>()
      for (const value of this) {
        if (other.has(value as T & U)) {
          result.add(value as T & U)
        }
      }
      return result
    }
  }

  if (!Set.prototype.difference) {
    Set.prototype.difference = function <T, U>(this: Set<T>, other: ReadonlySetLike<U>): Set<T> {
      const result = new Set<T>()
      for (const value of this) {
        if (!other.has(value as unknown as U)) {
          result.add(value)
        }
      }
      return result
    }
  }
}
