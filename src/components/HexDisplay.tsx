import { Flex, Grid } from '@radix-ui/themes'
import { range } from 'lodash'
import { FileSchemas } from 'pokemon-files'
import { useMemo, useState } from 'react'
import { OHPKM } from 'src/types/pkm/OHPKM'
import './components.css'

interface HexDisplayProps {
  data: Uint8Array
  format?: keyof typeof FileSchemas | 'OHPKM'
}

function HexDisplay({ data, format }: HexDisplayProps) {
  const [currentHover, setCurrentHover] = useState<number>()
  const schema = useMemo(() => {
    if (format === 'OHPKM') {
      return OHPKM.schema
    }
    return format ? FileSchemas[format] : undefined
  }, [format])

  const hoveredField = useMemo(
    () =>
      currentHover
        ? schema?.fields.find(
            (f) =>
              f.byteOffset !== undefined &&
              f.byteOffset <= currentHover &&
              currentHover < f.byteOffset + (f.numBytes ?? 1)
          )
        : undefined,
    [schema, currentHover]
  )

  return (
    <Grid columns="1fr 4fr 2fr" className="hex-display-grid">
      <Flex direction="column">
        {range(data.length / 16).map((index) => (
          <div key={`row_index_${index}`}>
            <code
              className="byte-row-display"
              style={{
                backgroundColor:
                  currentHover !== undefined && Math.floor(currentHover / 16) === index
                    ? 'var(--byte-hover)'
                    : undefined,
              }}
            >
              {(index * 16).toString(16).padStart(4, '0')}
            </code>
          </div>
        ))}
      </Flex>
      <Grid columns="repeat(8, min-content 1fr)">
        {Array.from(data).map((byte, i) => (
          <div key={`byte_${i}`}>
            <code
              className="single-byte-display"
              onMouseOver={() => {
                setCurrentHover(i)
              }}
              style={{
                backgroundColor:
                  currentHover === i ||
                  (hoveredField?.byteOffset &&
                    i >= hoveredField.byteOffset &&
                    i < hoveredField.byteOffset + (hoveredField.numBytes ?? 1))
                    ? 'var(--byte-hover)'
                    : undefined,
              }}
              title={`${i}\n0x${i
                .toString(16)
                .padStart(
                  4,
                  '0'
                )}\n${binaryFromHexString(byte.toString(16).toUpperCase().padStart(2, '0'))}\n${
                schema?.fields.find(
                  (f) =>
                    f.byteOffset !== undefined &&
                    f.byteOffset <= i &&
                    i < f.byteOffset + (f.numBytes ?? 1)
                )?.name ?? ''
              }`}
            >
              {byte.toString(16).toUpperCase().padStart(2, '0')}
            </code>
          </div>
        ))}
      </Grid>
      <Grid columns="repeat(16, min-content)" style={{ marginLeft: 'auto' }}>
        {Array.from(data).map((byte, i) => (
          <div key={`byte_${i}`}>
            <code
              className="single-byte-display"
              onMouseOver={() => {
                setCurrentHover(i)
              }}
              style={{
                backgroundColor:
                  currentHover === i ||
                  (hoveredField?.byteOffset &&
                    i >= hoveredField.byteOffset &&
                    i < hoveredField.byteOffset + (hoveredField.numBytes ?? 1))
                    ? 'var(--byte-hover)'
                    : undefined,
              }}
            >
              {byte >= 32 && byte < 127 ? String.fromCharCode(byte) : '.'}
            </code>
          </div>
        ))}
      </Grid>
    </Grid>
  )
}

function binaryFromHexString(str: string) {
  return '0b' + parseInt(str, 16).toString(2).padStart(8, '0')
}
export default HexDisplay
