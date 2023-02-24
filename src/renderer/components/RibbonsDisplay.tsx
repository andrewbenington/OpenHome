import { Tooltip } from '@mui/material';
import { Gen9RibbonsPart2 } from '../../consts/Ribbons';
import { PK3 } from '../../types/PKM/PK3';
import { PKM } from '../../types/PKM/PKM';

const getRibbonURL = (mon: PKM, ribbon: string) => {
  if (PKM instanceof PK3) {
  } else if (Gen9RibbonsPart2.indexOf(ribbon) > 33) {
    return `https://www.serebii.net/scarletviolet/ribbons/${ribbon
      .toLowerCase()
      .replaceAll(' ', '')}${ribbon.endsWith('Mark') ? '' : 'ribbon'}.png`;
  } else {
    if (ribbon.endsWith('Mark')) {
      return `https://raw.githubusercontent.com/msikma/pokesprite/master/misc/mark/${ribbon
        .toLowerCase()
        .replaceAll(' ', '-')}.png`;
    } else {
      return `https://raw.githubusercontent.com/msikma/pokesprite/master/misc/ribbon/gen8/${ribbon
        .toLowerCase()
        .replaceAll(' ', '-')}-ribbon.png`;
    }
  }
};

const RibbonsDisplay = (props: { mon: PKM }) => {
  const { mon } = props;
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginLeft: 10,
        padding: 10,
      }}
    >
      {mon.ribbons.map((ribbon) => (
        <Tooltip title={`${ribbon} ${ribbon.endsWith('Mark') ? '' : 'Ribbon'}`}>
          <img
            draggable={false}
            key={`${ribbon}_${ribbon.endsWith('Mark') ? '' : 'Ribbon'}`}
            alt={`${ribbon} ${ribbon.endsWith('Mark') ? '' : 'Ribbon'}`}
            style={{ width: 50, height: 50 }}
            src={getRibbonURL(mon, ribbon)}
          />
        </Tooltip>
      ))}
    </div>
  );
};

export default RibbonsDisplay;
