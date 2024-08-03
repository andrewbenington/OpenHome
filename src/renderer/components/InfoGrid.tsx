import { Card, Grid } from '@mui/material'
import { Dayjs } from 'dayjs'
import { useMemo } from 'react'

type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

type Breakpoints = {
  [key in Breakpoint]?: number
}

type InfoGridProps = {
  labelBreakpoints?: Breakpoints
  data: { [key: string]: string | JSX.Element | undefined } | object
}

const defaultLabelBreakpoints = { xs: 6, md: 4, xl: 3 }

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
    <Card variant="elevation" style={{ overflowY: 'auto' }}>
      <Grid container rowSpacing={1}>
        {Object.entries(data)
          .filter(([, value]) => value !== undefined && value !== null)
          .map(([key, value], index) => [
            <Grid
              item
              key={`info-row-${index}-label`}
              {...(typeof value === 'object' && !('$isDayjsObject' in value)
                ? { xs: 12 }
                : labelBreakpoints)}
              fontWeight="bold"
            >
              {key}
            </Grid>,
            typeof value === 'object' ? (
              '$isDayjsObject' in value ? (
                <Grid item {...dataBreakpoints} key={`info-row-${index}-value`}>
                  Dayjs({(value as Dayjs).format('YYYY-MM-DD HH:mm')})
                </Grid>
              ) : (
                <Grid item xs={12} key={`info-row-${index}-value`}>
                  {'props' in value ? (
                    value
                  ) : (
                    <InfoGrid data={value} labelBreakpoints={labelBreakpoints} />
                  )}
                </Grid>
              )
            ) : (
              <Grid item {...dataBreakpoints} key={`info-row-${index}-value`}>
                {value.toString()}
              </Grid>
            ),
          ])}
      </Grid>
    </Card>
  )
}
