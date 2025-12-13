import { ShinyLeaves } from '@pkm-rs/pkg'
import { getPublicImageURL } from 'src/ui/images/images'

const styles = {
  crownIcon: {
    height: 20,
    imageRendering: 'pixelated' as 'pixelated',
    filter: 'drop-shadow(1px 1px grey)',
  },
  leafIconFull: {
    marginRight: -7,
    height: 20,
    width: 20,
    imageRendering: 'pixelated' as 'pixelated',
    filter: 'drop-shadow(1px 1px grey)',
  },
  leafIconEmpty: {
    marginRight: -7,
    height: 20,
    width: 20,
    imageRendering: 'pixelated' as 'pixelated',
    filter: 'grayscale(100%) drop-shadow(1px 1px grey)',
    opacity: 0.8,
  },
}

interface ShinyLeafIconProps {
  full: boolean
  index: number
}

const ShinyLeafIcon = (props: ShinyLeafIconProps) => {
  const { full, index } = props

  return (
    <img
      alt={`shiny leaf ${index + 1} (${full ? 'full' : 'empty'})`}
      draggable={false}
      src={getPublicImageURL('icons/ShinyLeaf.png')}
      style={{
        ...(full ? styles.leafIconFull : styles.leafIconEmpty),
        zIndex: index + 1,
      }}
    />
  )
}

interface ShinyLeavesProps {
  leaves: ShinyLeaves
}

const ShinyLeavesDisplay = ({ leaves }: ShinyLeavesProps) => {
  return leaves.hasCrown() ? (
    <img
      alt="shiny_leaf_crown"
      draggable={false}
      src={getPublicImageURL('icons/LeafCrown.png')}
      style={styles.crownIcon}
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
