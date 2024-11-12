import { FileSchemas } from 'pokemon-files'
import HexEditor from '../components/HexEditor'

interface RawDisplayProps {
  bytes: Uint8Array
  format?: string
}

const RawDisplay = ({ bytes, format }: RawDisplayProps) => {
  return format && format in FileSchemas ? (
    <HexEditor data={bytes} format={format as keyof typeof FileSchemas} />
  ) : (
    <div />
  )
}
export default RawDisplay
