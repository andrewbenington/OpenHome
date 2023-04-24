import { Tooltip } from '@mui/material';
import { RibbonsMap } from 'renderer/images/Images';
import { Gen9Ribbons } from '../../consts/Ribbons';
import { PKM } from '../../types/PKMTypes/PKM';
import { detailsPaneContentStyle } from './styles';

const RibbonsDisplay = (props: { mon: PKM }) => {
  const { mon } = props;

  const formatRibbon = (ribbon: string) => {
    if (ribbon.endsWith('Mark')) {
      return ribbon;
    }
    if (ribbon.includes(' (')) {
      const [contestRibbon, region] = ribbon.split(' (');
      return `${contestRibbon} Ribbon (${region}`;
    }
    if (ribbon === 'Contest Memory') {
      return `${ribbon} Ribbon (${mon.contestMemoryCount})`;
    }
    if (ribbon === 'Battle Memory') {
      return `${ribbon} Ribbon (${mon.battleMemoryCount})`;
    }
    return `${ribbon} Ribbon`;
  };

  const getRibbonImage = (ribbon: string) => {
    if (ribbon === 'Contest Memory' && mon.contestMemoryCount === 40) {
      return RibbonsMap['Contest Memory Gold'];
    }
    if (ribbon === 'Battle Memory' && mon.contestMemoryCount === 6) {
      return RibbonsMap['battle Memory Gold'];
    }
    return RibbonsMap[ribbon];
  };

  return (
    <div
      style={{
        ...detailsPaneContentStyle,
        flexDirection: 'row',
        flexWrap: 'wrap',
        height: undefined,
      }}
    >
      {mon.ribbons.map((ribbon) => {
        const ribbonDisplay = formatRibbon(ribbon);
        return (
          <Tooltip title={ribbonDisplay}>
            <img
              draggable={false}
              key={ribbonDisplay}
              alt={ribbonDisplay}
              style={{
                width: 50,
                height: 50,
                borderWidth: 2,
                imageRendering: 'pixelated',
                ...(Gen9Ribbons.indexOf(ribbon) === mon.affixedRibbon
                  ? {
                      backgroundColor: '#fff6',
                      borderRadius: 5,
                      borderWidth: 2,
                      borderStyle: 'solid',
                      borderColor: 'white',
                    }
                  : {}),
              }}
              src={getRibbonImage(ribbon)}
            />
          </Tooltip>
        );
      })}
    </div>
  );
};

export default RibbonsDisplay;
