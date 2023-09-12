export const moveCardStyle = {
  height: 50,
  flex: 1,
  margin: 5,
  textAlign: 'center' as 'center',
  display: 'flex' as 'flex',
  flexDirection: 'column' as 'column',
  justifyContent: 'center' as 'center',
};

const styles = {
  detailsPane: {
    width: '50%',
    height: '100%',
    marginLeft: 10,
    borderTopRightRadius: 0,
    display: 'flex',
    flexDirection: 'column' as 'column',
  },
  detailsPaneContent: {
    display: 'flex',
    flexDirection: 'column' as 'column',
    height: 'calc(100% - 20px)',
    padding: 10,
  },
  flexRow: { display: 'flex', flexDirection: 'row' as 'row' },
  flexRowWrap: {
    display: 'flex',
    flexDirection: 'row' as 'row',
    flexWrap: 'wrap' as 'wrap',
  },
  pokemonDisplay: {
    display: 'flex',
    flexDirection: 'row' as 'row',
    width: '100%',
    height: '100%',
  },
};

export default styles;
