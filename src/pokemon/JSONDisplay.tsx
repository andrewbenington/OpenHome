import { Flex } from '@radix-ui/themes'
import { JSONTree } from 'react-json-tree'
import { PKMInterface } from '../types/interfaces'

interface JSONDisplayProps {
  mon: PKMInterface
}

export default function JSONDisplay(props: JSONDisplayProps) {
  const { mon } = props

  const jsonTheme = {
    base00: '#0000',
    base01: '#383830',
    base02: '#49483e',
    base03: 'inherit', // number of keys
    base04: '#a59f85',
    base05: '#f8f8f2',
    base06: '#f5f4f1',
    base07: '#f9f8f5',
    base08: 'purple', // null/undefined
    base09: 'red', // true/false/numbers
    base0A: '#f4bf75',
    base0B: 'green', // strings
    base0C: '#a1efe4',
    base0D: '#ffffff', // keys
    base0E: '#ae81ff',
    base0F: '#cc6633',
  }

  return (
    <Flex display="flex" direction="column" width="100%" pl="2">
      <JSONTree theme={jsonTheme} data={mon} />
    </Flex>
  )
}
