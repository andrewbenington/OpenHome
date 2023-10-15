import { Grid } from '@mui/material'
import { Buffer } from 'buffer'
import hexy from 'hexy'
import { CSSProperties, useEffect, useState } from 'react'

interface HexEditorProps {
  data: Uint8Array
}

const styles: { [key: string]: CSSProperties } = {
  grid: {
    width: '100%',
    overflowY: 'scroll',
    fontSize: 14,
  },
  prefix: {
    width: 'fit-content',
    paddingRight: 5,
    paddingLeft: 5,
    fontWeight: 'bold',
  },
}

const HexEditor = ({ data }: HexEditorProps) => {
  const [hexyText, setHexyText] = useState<string>()
  const [currentHover, setCurrentHover] = useState<number>()

  useEffect(() => {
    if (data) {
      const h = hexy.hexy(Buffer.from(data), {
        caps: 'upper',
      })
      setHexyText(h)
    }
  }, [data])

  if (!hexyText) {
    return <div />
  }
  return (
    <Grid container style={styles.grid}>
      {hexyText.split('\n').map((line, i) => {
        const [prefix, ...rest] = line.split(' ')
        const bytePairs = rest.slice(0, -1)
        const ascii = rest[rest.length - 1]
        if (bytePairs.length === 0) {
          return <div key={`line_${i}_prefix`} />
        }
        return (
          <>
            <Grid item xs={1.5} key={`line_${i}_prefix`} style={{}}>
              <code
                key={`line_${i}_prefix`}
                className="disable-select"
                style={{
                  ...styles.prefix,
                  backgroundColor:
                    currentHover && Math.floor(currentHover / 16) === i ? '#fffa' : '#ccc',
                }}
              >
                {prefix.substring(4, 8)}
              </code>
            </Grid>
            <Grid item xs={7.5} display="flex" flexDirection="row">
              {bytePairs.map((pair, j) => {
                const byteIndex = 16 * i + 2 * j
                return (
                  <>
                    <div
                      key={`byte_${byteIndex}`}
                      style={{
                        backgroundColor: currentHover === byteIndex ? 'white' : '#0000',
                      }}
                      onMouseOver={() => {
                        setCurrentHover(byteIndex)
                      }}
                    >
                      <code>{pair.substring(0, 2)}</code>
                    </div>
                    <div
                      key={`byte_${byteIndex + 1}`}
                      style={{
                        backgroundColor: currentHover === byteIndex + 1 ? 'white' : '#0000',
                        marginRight: 10,
                      }}
                      onMouseOver={() => {
                        setCurrentHover(byteIndex + 1)
                      }}
                    >
                      <code>{pair.substring(2)}</code>
                    </div>
                  </>
                )
              })}
            </Grid>
            <Grid item xs={3} display="flex" flexDirection="row">
              {ascii.split('').map((char, k) => {
                const byteIndex = 16 * i + k
                return (
                  <div
                    key={`byte_ascii_${byteIndex}`}
                    className="disable-select"
                    style={{
                      backgroundColor: currentHover === byteIndex ? '#fffa' : '#0000',
                    }}
                    onMouseOver={() => {
                      setCurrentHover(byteIndex)
                    }}
                  >
                    <code>{char}</code>
                  </div>
                )
              })}
            </Grid>
          </>
        )
      })}
    </Grid>
  )
}

export default HexEditor
