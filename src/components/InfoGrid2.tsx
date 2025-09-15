import { Code, DataList, Flex, Separator } from '@radix-ui/themes'
import type { Responsive } from '@radix-ui/themes/props'
import { isDayjs } from 'dayjs'

const primitiveTypes = ['number', 'bigint', 'boolean', 'string', 'undefined', 'null']

type Primitive = number | boolean | string | null | undefined

function isPrimitive(obj: object | Primitive): obj is Primitive {
  return obj === null || primitiveTypes.includes(typeof obj)
}

type InfoGridProps = {
  data?: Record<string, any>
  labelWidth?: Responsive<string>
  gap?: number
}

export function InfoGrid(props: InfoGridProps) {
  const { data: propData, labelWidth, gap } = props

  const data = propData

  return (
    <DataList.Root style={{ rowGap: gap ?? 12, columnGap: 8, width: '100%' }}>
      {Object.entries(data ?? {})
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => (
          <InfoGridItem key={key} objectKey={key} value={value} labelWidth={labelWidth} />
        ))}
    </DataList.Root>
  )
}

type InfoGridItemProps = {
  objectKey: string
  value: object | Primitive
  labelWidth?: Responsive<string>
}

function InfoGridItem(props: InfoGridItemProps) {
  const { objectKey: key, value: propValue, labelWidth: labelWidthProp } = props

  let value = propValue

  if (!isPrimitive(value)) {
    if (Array.isArray(value) && isPythonTupleList(value)) {
      let newValue: Record<string, string> = {}

      value.forEach((innerVal) => {
        newValue[innerVal._1] = innerVal._2
      })
      value = newValue
    } else if (isDayjs(value)) {
      value = {
        date: value.format('MMM D, YYYY'),
        time: value.format('h:mm A'),
        timezone: value.format('UTC Z'),
      }
    }
  }

  const labelWidth = labelWidthProp ?? 'fit-content'

  return isPrimitive(value) ? (
    <DataList.Item>
      <DataList.Label minWidth={labelWidth}>
        <Code color="gray">{key}</Code>
      </DataList.Label>
      <DataList.Value>
        {value === '' ? (
          <Code variant="ghost" color={'gray'}>
            {'<empty>'}
          </Code>
        ) : typeof value === 'string' ? (
          <code>{value}</code>
        ) : (
          <Code
            variant="ghost"
            color={
              value === null
                ? 'tomato'
                : typeof value === 'number'
                  ? 'blue'
                  : typeof value === 'boolean'
                    ? 'amber'
                    : 'gray'
            }
          >{`${value}`}</Code>
        )}
      </DataList.Value>
    </DataList.Item>
  ) : Array.isArray(value) ? (
    <DataList.Item>
      <DataList.Label minWidth={labelWidth}>
        <Code color="gray">{key}</Code>
      </DataList.Label>
      <DataList.Value>
        {value.length === 0 ? (
          '[]'
        ) : value.every(isPrimitive) ? (
          <Flex wrap="wrap" gapX="1">
            {value
              .filter((v) => !!v)
              .map((innerVal, index) => (
                <DataList.Item key={`${key}_${index}`}>
                  <Code
                    color="gray"
                    style={{ width: 'fit-content', marginBottom: 8 }}
                  >{`${innerVal}`}</Code>
                </DataList.Item>
              ))}
          </Flex>
        ) : (
          <fieldset style={{ width: '100%', gap: 8, borderLeft: '1px solid var(--gray-11)' }}>
            {value
              .filter((v) => !!v)
              .map((innerVal, index) => (
                <DataList.Item key={`${key}_${index}`}>
                  {index !== 0 && <Separator style={{ margin: '8px 0px' }} />}
                  <InfoGrid data={innerVal} />
                </DataList.Item>
              ))}
          </fieldset>
        )}
      </DataList.Value>
    </DataList.Item>
  ) : (
    <DataList.Item>
      <DataList.Label minWidth={labelWidth}>
        <Code color="gray">{key}</Code>
      </DataList.Label>
      <DataList.Value>
        <fieldset style={{ width: '100%', borderLeft: '1px solid var(--gray-11)' }}>
          <InfoGrid data={value} />
        </fieldset>
      </DataList.Value>
    </DataList.Item>
  )
}

type PythonTuple = {
  _1: string
  _2: string
}

function isPythonTuple(value: object): value is PythonTuple {
  return Object.values(value).length === 2 && '_1' in value && '_2' in value
}

function isPythonTupleList(value: (object | Primitive)[]): value is PythonTuple[] {
  return value.every((innerVal) => !isPrimitive(innerVal) && isPythonTuple(innerVal))
}
