// The data-only grammar emitted by gen1recomp SaveSerializer.
// Strings contain Lua bytes, not JavaScript Unicode, so unknown binary mod data survives.
export type LuaValue = string | number | boolean | LuaTable
export type LuaKey = string | number
export type LuaTable = Map<LuaKey, LuaValue>
const MAX_BYTES = 32 * 1024 * 1024
const MAX_NODES = 1000000
const MAX_DEPTH = 128

export function table(value: LuaValue | undefined, name = 'value'): LuaTable {
  if (!(value instanceof Map)) throw new Error(`${name} must be a Lua table`)
  return value
}

export function optionalTable(value: LuaValue | undefined): LuaTable {
  return value === undefined ? new Map() : table(value)
}

export function luaString(value: string): string {
  return byteString(new TextEncoder().encode(value))
}

export function text(value: LuaValue | undefined, fallback = ''): string {
  if (value === undefined) return fallback
  if (typeof value !== 'string') throw new Error('Expected a Lua string')
  return new TextDecoder('utf-8', { fatal: true }).decode(bytesOf(value))
}

export function number(value: LuaValue | undefined, fallback = 0): number {
  if (value === undefined) return fallback
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error('Expected a number')
  return value
}

export function integer(value: LuaValue | undefined, max: number, fallback = 0): number {
  const n = number(value, fallback)
  if (!Number.isInteger(n) || n < 0 || n > max) throw new Error(`Number outside 0..${max}`)
  return n
}

export function byteString(bytes: Uint8Array): string {
  const chunks: string[] = []
  for (let i = 0; i < bytes.length; i += 8192) {
    chunks.push(String.fromCharCode(...bytes.subarray(i, i + 8192)))
  }
  return chunks.join('')
}

function bytesOf(s: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(s, (c) => c.charCodeAt(0))
}

export function parseLua(bytes: Uint8Array): LuaTable {
  if (bytes.length > MAX_BYTES) throw new Error('Lua save exceeds 32 MiB')
  const src = byteString(bytes)
  let pos = 0
  let nodes = 0
  const fail = (why: string): never => {
    throw new Error(`Lua save at byte ${pos + 1}: ${why}`)
  }
  const skip = () => {
    while (pos < src.length && /[ \t\r\n]/.test(src[pos])) pos++
  }
  const token = (s: string) => {
    skip()
    if (!src.startsWith(s, pos)) fail(`expected ${s}`)
    pos += s.length
  }
  const ident = () => {
    const match = /^[A-Za-z_][A-Za-z_0-9]*/.exec(src.slice(pos))
    if (!match) return fail('expected identifier')
    pos += match[0].length
    return match[0]
  }
  const escapes: Record<string, string> = {
    '"': '"',
    '\\': '\\',
    a: '\x07',
    b: '\b',
    f: '\f',
    n: '\n',
    r: '\r',
    t: '\t',
    v: '\v',
    '\n': '\n',
    '\r': '\n',
  }
  function value(depth: number): LuaValue {
    if (++nodes > MAX_NODES) fail('too many values')
    if (depth > MAX_DEPTH) fail('nesting too deep')
    skip()
    if (src[pos] === '"') {
      pos++
      const out: string[] = []
      while (pos < src.length) {
        const c = src[pos++]
        if (c === '"') return out.join('')
        if (c !== '\\') {
          out.push(c)
          continue
        }
        const digits = /^\d{1,3}/.exec(src.slice(pos))
        if (digits) {
          const code = Number(digits[0])
          if (code > 255) fail('escape exceeds one byte')
          pos += digits[0].length
          out.push(String.fromCharCode(code))
        } else {
          const escaped = escapes[src[pos++]]
          if (escaped === undefined) fail('invalid string escape')
          out.push(escaped)
        }
      }
      return fail('unterminated string')
    }
    if (src[pos] === '{') {
      pos++
      const result: LuaTable = new Map()
      skip()
      while (src[pos] !== '}') {
        let key: LuaValue
        if (src[pos] === '[') {
          pos++
          key = value(depth + 1)
          token(']')
        } else key = ident()
        if (typeof key !== 'string' && typeof key !== 'number') fail('invalid table key')
        token('=')
        if (result.has(key as LuaKey)) fail('duplicate table key')
        result.set(key as LuaKey, value(depth + 1))
        skip()
        if (src[pos] === '}') break
        token(',')
        skip()
      }
      pos++
      return result
    }
    if (/[A-Za-z_]/.test(src[pos] ?? '')) {
      const word = ident()
      if (word === 'true') return true
      if (word === 'false') return false
      return fail('only literal values are allowed')
    }
    const match = /^-?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/.exec(src.slice(pos))
    if (!match) return fail('expected a value')
    pos += match[0].length
    const n = Number(match[0])
    if (!Number.isFinite(n)) fail('nonfinite number')
    return n
  }
  skip()
  if (ident() !== 'return') fail('expected return')
  const result = table(value(0), 'save')
  skip()
  if (pos !== src.length) fail('trailing content')
  return result
}

export function encodeLua(root: LuaTable): Uint8Array<ArrayBuffer> {
  let nodes = 0
  function encode(v: LuaValue, depth: number): string {
    if (++nodes > MAX_NODES || depth > MAX_DEPTH) throw new Error('Lua save exceeds limits')
    if (v instanceof Map) {
      if (!v.size) return '{}'
      const entries = [...v].sort(([a], [b]) => {
        if (typeof a !== typeof b) return typeof a === 'number' ? -1 : 1
        return a < b ? -1 : a > b ? 1 : 0
      })
      const pad = '  '.repeat(depth)
      return (
        '{\n' +
        entries
          .map(([k, val]) => {
            const key =
              typeof k === 'string' && /^[A-Za-z_][A-Za-z_0-9]*$/.test(k)
                ? k
                : `[${encode(k, depth + 1)}]`
            return `${pad}  ${key} = ${encode(val, depth + 1)},\n`
          })
          .join('') +
        pad +
        '}'
      )
    }
    if (typeof v === 'string') {
      return (
        '"' +
        v.replace(/[\x00-\x1f\x7f"\\]/g, (c) => {
          if (c === '"' || c === '\\') return '\\' + c
          return '\\' + c.charCodeAt(0).toString().padStart(3, '0')
        }) +
        '"'
      )
    }
    if (typeof v === 'number' && !Number.isFinite(v)) throw new Error('Nonfinite Lua number')
    return String(v)
  }
  const output = `return ${encode(root, 0)}\n`
  if (output.length > MAX_BYTES) throw new Error('Lua save exceeds 32 MiB')
  return bytesOf(output)
}

export function numericEntries(t: LuaTable, max: number): [number, LuaValue][] {
  return [...t]
    .map(([k, v]): [number, LuaValue] => {
      if (typeof k !== 'number' || !Number.isInteger(k) || k < 1 || k > max) {
        throw new Error(`Invalid slot index ${String(k)}`)
      }
      return [k, v]
    })
    .sort(([a], [b]) => a - b)
}

export function luaArray(values: LuaValue[]): LuaTable {
  return new Map(values.map((v, i) => [i + 1, v]))
}
