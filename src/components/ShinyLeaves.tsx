import { getPublicImageURL } from '../images/images'

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
  first: boolean
  second: boolean
  third: boolean
  fourth: boolean
  fifth: boolean
  crown: boolean
}

const ShinyLeaves = (props: ShinyLeavesProps) => {
  const { first, second, third, fourth, fifth, crown } = props

  return crown ? (
    <img
      alt="shiny_leaf_crown"
      draggable={false}
      src={getPublicImageURL('icons/LeafCrown.png')}
      style={styles.crownIcon}
    />
  ) : (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <ShinyLeafIcon full={first} index={0} />
      <ShinyLeafIcon full={second} index={1} />
      <ShinyLeafIcon full={third} index={2} />
      <ShinyLeafIcon full={fourth} index={3} />
      <ShinyLeafIcon full={fifth} index={4} />
    </div>
  )
}

export default ShinyLeaves
