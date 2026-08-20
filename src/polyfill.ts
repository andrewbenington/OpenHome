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

  addIteratorHelpers()
}

function addIteratorHelpers() {
  const iteratorProto: any = Object.getPrototypeOf(Object.getPrototypeOf([][Symbol.iterator]()))

  if (!iteratorProto || typeof iteratorProto !== 'object') return

  if (!iteratorProto.toArray) {
    iteratorProto.toArray = function <T>(this: Iterable<T>): T[] {
      return [...this]
    }
  }

  if (!iteratorProto.map) {
    iteratorProto.map = function* <T, U>(this: Iterable<T>, fn: (value: T, index: number) => U) {
      let index = 0
      for (const value of this) {
        yield fn(value, index++)
      }
    }
  }

  if (!iteratorProto.filter) {
    iteratorProto.filter = function* <T>(
      this: Iterable<T>,
      predicate: (value: T, index: number) => boolean
    ) {
      let index = 0
      for (const value of this) {
        if (predicate(value, index++)) {
          yield value
        }
      }
    }
  }

  if (!iteratorProto.take) {
    iteratorProto.take = function* <T>(this: Iterable<T>, limit: number) {
      let remaining = limit
      for (const value of this) {
        if (remaining-- <= 0) return
        yield value
      }
    }
  }

  if (!iteratorProto.drop) {
    iteratorProto.drop = function* <T>(this: Iterable<T>, limit: number) {
      let remaining = limit
      for (const value of this) {
        if (remaining-- > 0) continue
        yield value
      }
    }
  }

  if (!iteratorProto.flatMap) {
    iteratorProto.flatMap = function* <T, U>(
      this: Iterable<T>,
      fn: (value: T, index: number) => Iterable<U>
    ) {
      let index = 0
      for (const value of this) {
        yield* fn(value, index++)
      }
    }
  }

  if (!iteratorProto.forEach) {
    iteratorProto.forEach = function <T>(this: Iterable<T>, fn: (value: T, index: number) => void) {
      let index = 0
      for (const value of this) {
        fn(value, index++)
      }
    }
  }

  if (!iteratorProto.some) {
    iteratorProto.some = function <T>(
      this: Iterable<T>,
      predicate: (value: T, index: number) => boolean
    ): boolean {
      let index = 0
      for (const value of this) {
        if (predicate(value, index++)) return true
      }
      return false
    }
  }

  if (!iteratorProto.every) {
    iteratorProto.every = function <T>(
      this: Iterable<T>,
      predicate: (value: T, index: number) => boolean
    ): boolean {
      let index = 0
      for (const value of this) {
        if (!predicate(value, index++)) return false
      }
      return true
    }
  }

  if (!iteratorProto.find) {
    iteratorProto.find = function <T>(
      this: Iterable<T>,
      predicate: (value: T, index: number) => boolean
    ): T | undefined {
      let index = 0
      for (const value of this) {
        if (predicate(value, index++)) return value
      }
      return undefined
    }
  }

  if (!iteratorProto.reduce) {
    iteratorProto.reduce = function <T, U>(
      this: Iterable<T>,
      reducer: (accumulator: U, value: T, index: number) => U,
      ...initial: [U] | []
    ): U {
      let index = 0
      let accumulator: U | undefined = initial.length > 0 ? initial[0] : undefined
      let hasAccumulator = initial.length > 0
      for (const value of this) {
        if (!hasAccumulator) {
          accumulator = value as unknown as U
          hasAccumulator = true
          index++
          continue
        }
        accumulator = reducer(accumulator as U, value, index++)
      }
      if (!hasAccumulator) {
        throw new TypeError('Reduce of empty iterator with no initial value')
      }
      return accumulator as U
    }
  }
}
