import { describe, expect, test } from 'vitest'
import { luaByteString, encodeLuaSave, luaString, parseLuaSave, luaTable, luaText } from '../serializer'

const bytes = (s: string) => new TextEncoder().encode(s)

test('preserves numeric versus string keys, binary strings and Unicode', () => {
  const source = bytes(
    'return { [1] = "number", ["1"] = "string", __proto__ = { constructor = true }, binary = "\\000\\2557", nickname = "Pokémon", nested = {}, fraction = -1.5e-3 }'
  )
  const value = parseLuaSave(source)
  expect(value.get(1)).toBe('number')
  expect(value.get('1')).toBe('string')
  expect(value.get('binary')).toBe('\x00\xff7')
  expect(luaText(value.get('nickname'))).toBe('Pokémon')
  expect(parseLuaSave(encodeLuaSave(value))).toEqual(value)
  expect(luaString('Pokémon')).toBe(value.get('nickname'))
  expect(luaTable(value.get('__proto__')).get('constructor')).toBe(true)
})

test('preserves all byte values through decimal escapes', () => {
  const raw = Uint8Array.from({ length: 256 }, (_, i) => i)
  const root = new Map([['raw', luaByteString(raw)]])
  expect(parseLuaSave(encodeLuaSave(root))).toEqual(root)
})

describe('rejects executable and malformed input', () => {
  for (const source of [
    'return os.execute("echo no")',
    'return { value = function() end }',
    'return {} os.execute("echo no")',
    'return { x = 1, x = 2 }',
    'return { [1] = 1, [1.0] = 2 }',
    'return { [true] = 1 }',
    'return { x = 1e999 }',
    'return { x = 0/0 }',
    'return { x = nil }',
    'return { x = "\\256" }',
    'return { x = "\\xFF" }',
    'return { x = "unclosed }',
    'return { x = 1',
    'return { 1, 2 }',
    'return true',
    'returnValue {}',
  ])
    test(source, () => expect(() => parseLuaSave(bytes(source))).toThrow())
})

test('bounds input size and recursion', () => {
  expect(() => parseLuaSave(new Uint8Array(32 * 1024 * 1024 + 1))).toThrow(/32 MiB/)
  expect(() => parseLuaSave(bytes('return ' + '{ x = '.repeat(130) + '1' + '}'.repeat(130)))).toThrow(
    /nesting/
  )
})
