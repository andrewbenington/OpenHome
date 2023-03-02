import { TextDecoder } from 'node:util'; // (ESM style imports)
import { utf16BytesToString } from 'util/Strings/StringConverter';

(global as any).TextDecoder = TextDecoder;

test('utf16 decoding null terminated', () => {
  const stringBuffer = new Uint8Array([
    0x53, 0x00, 0x6c, 0x00, 0x6f, 0x00, 0x77, 0x00, 0x70, 0x00, 0x6f, 0x00,
    0x6b, 0x00, 0x65, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  ]);
  expect(utf16BytesToString(stringBuffer, 0, 12)).toStrictEqual('Slowpoke');
});
