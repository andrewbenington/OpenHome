export const tabButtonStyle = {
  margin: 0,
  borderRadius: 0,
  fontSize: 16,
  padding: '10px 20px 12px 20px',
};

export const fileTypeChipStyle = {
  left: 10,
  top: 10,
  color: 'white',
  fontWeight: 'bold',
  fontSize: 20,
  zIndex: 1,
  borderRadius: 25,
  '& .MuiSelect-select': {
    paddingTop: 0,
    paddingBottom: 0,
  },
  position: 'absolute' as 'absolute',
};

export const detailsPaneStyle = {
  width: '50%',
  height: '100%',
  marginLeft: 10,
  borderTopRightRadius: 0,
  display: 'flex',
  flexDirection: 'column' as 'column',
};

export const detailsPaneScrollContainerStyle = {
  backgroundColor: '#fff4',
  height: '100%',
  overflow: 'scroll',
};

export const detailsPaneContentStyle = {
  display: 'flex',
  flexDirection: 'column' as 'column',
  height: 'calc(100% - 20px)',
  padding: 10,
};

export const leafCrownIconStyle = {
  height: 20,
  imageRendering: 'pixelated' as 'pixelated',
  filter: 'drop-shadow(1px 1px grey)',
};

export const shinyLeafIconStyle = {
  marginRight: -7,
  height: 20,
  width: 20,
  imageRendering: 'pixelated' as 'pixelated',
  filter: 'drop-shadow(1px 1px grey)',
};

export const shinyLeafEmptyIconStyle = {
  marginRight: -7,
  height: 20,
  width: 20,
  imageRendering: 'pixelated' as 'pixelated',
  filter: 'grayscale(100%) drop-shadow(1px 1px grey)',
  opacity: 0.8,
};
