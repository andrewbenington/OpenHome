import { Card, Divider, Grid, Stack } from '@mui/joy'
import { isDayjs } from 'dayjs'
import { useMemo } from 'react'
type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const primitiveTypes = ['number', 'bigint', 'boolean', 'string', 'undefined', 'null']

type Primitive = number | boolean | string | undefined

type Breakpoints = {
  [key in Breakpoint]?: number
}

type InfoGridProps = {
  labelBreakpoints?: Breakpoints
  data: object
}

const defaultLabelBreakpoints = { xs: 6, md: 4, xl: 3 }

function onlyPrimitiveValues(obj: object) {
  return Object.values(obj).every((val) => primitiveTypes.includes(typeof val))
}

function isArray(obj: object): obj is (object | Primitive)[] {
  return Object.prototype.toString.call(obj) === '[object Array]'
}

export function InfoGrid(props: InfoGridProps) {
  const { data, labelBreakpoints: customLabelBreakpoints } = props

  const labelBreakpoints: Breakpoints = useMemo(
    () => customLabelBreakpoints ?? defaultLabelBreakpoints,
    [customLabelBreakpoints]
  )
  const dataBreakpoints: Breakpoints = useMemo(() => {
    const map: Breakpoints = {}

    Object.entries(labelBreakpoints ?? defaultLabelBreakpoints).map(
      ([key, value]) => (map[key as Breakpoint] = 12 - value)
    )

    return map
  }, [labelBreakpoints])

  return (
    <Grid container style={{ height: 'inherit' }}>
      {Object.entries(data)
        .filter(([, value]) => value !== undefined && value !== null)
        .map(([key, value], index) => (
          <InfoGridElement
            key={`info-row-${index}`}
            objKey={key}
            value={value}
            labelBreakpoints={labelBreakpoints}
            dataBreakpoints={dataBreakpoints}
            isLast={index === Object.entries(data).length - 1}
          />
        ))}
    </Grid>
  )
}

function shouldBeExpandable(value: React.ReactNode | object) {
  if (!value) return false

  return (
    typeof value === 'object' &&
    Object.entries(value).length > 0 &&
    // !onlyPrimitiveValues(value) &&
    !('$isDayjsObject' in value)
  )
}

function shouldAlignRight(value: React.ReactNode | object) {
  return (
    !value ||
    (typeof value === 'object' &&
      (Object.entries(value).length === 0 || isArray(value) || onlyPrimitiveValues(value)))
  )
}

export type InfoGridElementProps = {
  objKey: string
  value: React.ReactNode | object
  labelBreakpoints: Breakpoints
  dataBreakpoints: Breakpoints
  isLast?: boolean
}

function InfoGridElement(props: InfoGridElementProps) {
  const { objKey: key, value, labelBreakpoints, dataBreakpoints, isLast } = props

  if (!value) return <div />

  // if (!shouldBeExpandable(value)) return <SimpleInfoGridElement {...props} />
  return (
    <Grid
      container
      rowGap={1}
      component={shouldBeExpandable(value) ? 'details' : 'div'}
      style={{ width: '100%', clear: 'both' }}
    >
      {/* <summary key={`info-row-${key}-summary`} style={{ fontSize: 18, fontWeight: 'bold' }}> */}
      <Grid
        component="summary"
        {...labelBreakpoints}
        style={{
          float: shouldAlignRight(value) ? 'left' : undefined,
          fontWeight: 'bold',
          marginBottom: shouldBeExpandable(value) && !shouldAlignRight(value) ? 8 : 0,
        }}
      >
        {key}
      </Grid>
      {/* </summary> */}
      {typeof value === 'object' ? (
        Object.entries(value).length === 0 ? (
          '{empty object}'
        ) : isDayjs(value) ? (
          <Grid {...dataBreakpoints} key={`info-row-value`}>
            Dayjs(
            {value.format('YYYY-MM-DD HH:mm')})
          </Grid>
        ) : isArray(value) ? (
          <Grid xs={12} key={`info-row-value`} marginBottom={1}>
            <Stack spacing={1}>
              {value.map((item, arrayIndex) =>
                typeof item === 'object' ? (
                  <Card variant="outlined" key={`info-row-array[${arrayIndex}]`}>
                    <details open>
                      <summary style={{ float: 'left', marginRight: 16 }}>{arrayIndex}</summary>
                      <InfoGrid data={item} labelBreakpoints={labelBreakpoints} />
                    </details>
                  </Card>
                ) : (
                  <div key={`info-row-array[${arrayIndex}]`}>{item}</div>
                )
              )}
            </Stack>
          </Grid>
        ) : (
          <Grid xs={12} key={`info-row-value`} marginBottom={1}>
            {'props' in value ? (
              value
            ) : (
              <Card variant="outlined">
                <InfoGrid data={value} labelBreakpoints={labelBreakpoints} />
              </Card>
            )}
          </Grid>
        )
      ) : value === '' ? (
        '(empty string)'
      ) : (
        value.toString()
      )}
      {!isLast && (
        <Divider
          style={{
            width: '100%',
            marginBottom: 4,
          }}
          key={`info-row-divider`}
        />
      )}
    </Grid>
  )
}
