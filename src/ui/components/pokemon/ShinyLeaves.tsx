import { getPublicImageURL } from '@openhome-ui/images/images'
import { ShinyLeaves } from '@pkm-rs/pkg'

interface ShinyLeafIconProps {
  full: boolean
  index: number
}

const ShinyLeafIcon = (props: ShinyLeafIconProps) => {
  const { full, index } = props

  return (
    <img
      className={full ? 'leaf-icon-full' : 'leaf-icon-empty'}
      alt={`shiny leaf ${index + 1} (${full ? 'full' : 'empty'})`}
      draggable={false}
      src={getPublicImageURL('icons/ShinyLeaf.png')}
    />
  )
}

interface ShinyLeavesProps {
  leaves: ShinyLeaves
}

const ShinyLeavesDisplay = ({ leaves }: ShinyLeavesProps) => {
  return leaves.hasCrown() ? (
    <img
      className="crown-icon"
      alt="shiny_leaf_crown"
      draggable={false}
      src={getPublicImageURL('icons/LeafCrown.png')}
    />
  ) : (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <ShinyLeafIcon full={leaves.hasFirst()} index={0} />
      <ShinyLeafIcon full={leaves.hasSecond()} index={1} />
      <ShinyLeafIcon full={leaves.hasThird()} index={2} />
      <ShinyLeafIcon full={leaves.hasFourth()} index={3} />
      <ShinyLeafIcon full={leaves.hasFifth()} index={4} />
    </div>
  )
}

export default ShinyLeavesDisplay
