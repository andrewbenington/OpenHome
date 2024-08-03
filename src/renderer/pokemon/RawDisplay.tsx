import HexEditor from '../components/HexEditor'

interface RawDisplayProps {
  bytes: Uint8Array
}

const RawDisplay = (props: RawDisplayProps) => {
  const { bytes } = props
  return (
    <div onDoubleClick={(e) => console.log(e)}>
      <HexEditor data={bytes} />
    </div>
  )
}
export default RawDisplay
