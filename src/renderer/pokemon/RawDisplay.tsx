import { FileSchemas } from 'pokemon-files'
import HexEditor from '../components/HexEditor'

interface RawDisplayProps {
  bytes: Uint8Array
  format: keyof typeof FileSchemas
}

const RawDisplay = ({ bytes, format }: RawDisplayProps) => {
  return <HexEditor data={bytes} format={format} />
}
export default RawDisplay
