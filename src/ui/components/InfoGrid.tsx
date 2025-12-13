import { OHPKM } from '@openhome/core/pkm/OHPKM'
import { HomeData } from '@openhome/core/save/HomeData'
import { PKM } from '@pokemon-files/pkm'
import { Card, Flex, Grid } from '@radix-ui/themes'
import { isDayjs } from 'dayjs'
import React, { ReactNode, useCallback, useMemo } from 'react'
import { getMonFileIdentifier } from 'src/util/Lookup'
import PokemonIcon from './PokemonIcon'

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

function isPKM(obj: object): obj is PKM {
  return 'format' in obj && 'dexNum' in obj && 'formeNum' in obj && 'nickname' in obj
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
    <Grid style={{ height: 'inherit' }}>
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
  const { objKey: key, value: valueProp, labelBreakpoints, dataBreakpoints, isLast } = props

  const Component = useCallback(
    (props: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>) =>
      shouldBeExpandable(valueProp)
        ? React.createElement('details', props)
        : React.createElement('div', props),
    [valueProp]
  )

  if (!valueProp) return <div />

  const value = valueProp instanceof HomeData ? valueProp.displayState() : valueProp

  // if (!shouldBeExpandable(value)) return <SimpleInfoGridElement {...props} />
  return (
    <Grid columns="2" asChild style={{ width: '100%', clear: 'both' }}>
      <Component
        style={{
          borderWidth: 0.5,
          borderBottomStyle: isLast ? undefined : 'solid',
          borderColor: 'inherit',
          padding: 3,
        }}
      >
        <summary
          style={{
            float: shouldAlignRight(value) ? 'left' : undefined,
            fontWeight: 'bold',
            marginBottom: shouldBeExpandable(value) && !shouldAlignRight(value) ? 8 : 0,
          }}
        >
          {key}
        </summary>
        {typeof value === 'object' ? (
          Object.entries(value).length === 0 ? (
            '{empty object}'
          ) : isDayjs(value) ? (
            <Grid {...dataBreakpoints} key={`info-row-value`}>
              Dayjs(
              {value.format('YYYY-MM-DD HH:mm')})
            </Grid>
          ) : isPKM(value) ? (
            <Grid {...dataBreakpoints} key={`info-row-value`}>
              PKM({value.nickname})
            </Grid>
          ) : value instanceof HomeData ? (
            <InfoGrid data={value.displayState()} labelBreakpoints={labelBreakpoints} />
          ) : 'name' in value &&
            typeof value.name === 'string' &&
            'tid' in value &&
            typeof value.tid === 'number' ? (
            <Grid {...dataBreakpoints} key={`info-row-value`}>
              SAV({value.name}, {value.tid})
            </Grid>
          ) : isArray(value) ? (
            <Grid key={`info-row-value`} mb="2">
              <Flex direction="column" gap="1">
                {value.map((item, arrayIndex) =>
                  typeof item === 'object' ? (
                    isPKM(item) ? (
                      <Card>
                        <Flex direction="row" align="center">
                          <PokemonIcon
                            dexNumber={item.dexNum}
                            formeNumber={item.formeNum}
                            style={{ width: 30, height: 30 }}
                          />
                          <div>
                            {item.nickname} • {item.format}
                            {item instanceof OHPKM ? ` • ${getMonFileIdentifier(item)}` : ''}
                          </div>
                        </Flex>
                      </Card>
                    ) : (
                      <Card key={`info-row-array[${arrayIndex}]`}>
                        <details open>
                          <summary style={{ float: 'left', marginRight: 16 }}>{arrayIndex}</summary>
                          <InfoGrid data={item} labelBreakpoints={labelBreakpoints} />
                        </details>
                      </Card>
                    )
                  ) : (
                    <div key={`info-row-array[${arrayIndex}]`}>{item}</div>
                  )
                )}
              </Flex>
            </Grid>
          ) : (
            <Grid key={`info-row-value`} mb="1">
              {'props' in value ? (
                (value as ReactNode)
              ) : (
                <Card>
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
      </Component>
    </Grid>
  )
}
