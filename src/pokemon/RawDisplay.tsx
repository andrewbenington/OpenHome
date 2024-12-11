import { FileSchemas } from 'pokemon-files'
import HexEditor from '../components/HexEditor'

interface RawDisplayProps {
  bytes: Uint8Array
  format?: string
}

const RawDisplay = ({ bytes, format }: RawDisplayProps) => (
  <HexEditor data={bytes} format={format as keyof typeof FileSchemas | undefined} />
)

export default RawDisplay
