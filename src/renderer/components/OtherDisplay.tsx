import Types from 'consts/Types';
import _ from 'lodash';
import { PK3 } from 'types/PKMTypes/PK3';
import { PK4 } from 'types/PKMTypes/PK4';
import { G2SAV } from 'types/SAV/G2SAV';
import { HGSSSAV } from 'types/SAV/HGSSSAV';
import { isRestricted } from 'types/TransferRestrictions';
import {
  getMonFileIdentifier,
  getMonGen12Identifier,
  getMonGen34Identifier,
} from 'util/Lookup';
import OHPKM from '../../types/PKMTypes/OHPKM';
import { PK1 } from '../../types/PKMTypes/PK1';
import { PK2 } from '../../types/PKMTypes/PK2';
import { PKM } from '../../types/PKMTypes/PKM';
import Alpha from '../images/icons/Alpha.png';
import GMax from '../images/icons/GMax.png';
import LeafCrown from '../images/icons/LeafCrown.png';
import ShinyLeaf from '../images/icons/ShinyLeaf.png';
import { getTypeColor } from '../util/PokemonSprite';
import AttributeRow from './AttributeRow';
import AttributeTag from './AttributeTag';
import {
  detailsPaneContentStyle,
  leafCrownIconStyle,
  shinyLeafEmptyIconStyle,
  shinyLeafIconStyle,
} from './styles';

const OtherDisplay = (props: { mon: PKM }) => {
  const { mon } = props;
  return (
    <div style={detailsPaneContentStyle}>
      {mon.personalityValue !== undefined ? (
        <AttributeRow
          label="Personality Value"
          value={'0x' + mon.personalityValue.toString(16).padStart(8, '0')}
        />
      ) : (
        <div />
      )}
      {mon.encryptionConstant !== undefined ? (
        <AttributeRow
          label="Encryption Constant"
          value={'0x' + mon.encryptionConstant.toString(16).padStart(8, '0')}
        />
      ) : (
        <div />
      )}
      {mon.secretID !== undefined ? (
        <AttributeRow
          label="Trainer Secret ID"
          value={'0x' + mon.secretID.toString(16).padStart(4, '0')}
        />
      ) : (
        <div />
      )}
      {mon.trainerFriendship !== undefined ? (
        <AttributeRow
          label="OT Friendship"
          value={mon.trainerFriendship.toString()}
        />
      ) : (
        <div />
      )}
      {mon.dexNum >= 265 && mon.dexNum <= 269 ? (
        <AttributeRow
          label="Wurmple Evolution"
          value={
            (((mon.personalityValue ?? 0) >> 16) & 0xffff) % 10 > 4
              ? 'Dustox'
              : 'Beautifly'
          }
        />
      ) : (
        <div />
      )}
      {mon.dexNum >= 265 && mon.dexNum <= 269 ? (
        <AttributeRow
          label="Wurmple Evolution"
          value={(
            (((mon.personalityValue ?? 0) >> 16) & 0xffff) %
            10
          ).toString()}
        />
      ) : (
        <div />
      )}
      {mon.encounterTypeLabel ? (
        <AttributeRow label="Encounter Type" value={mon.encounterTypeLabel} />
      ) : (
        <div />
      )}
      {!isRestricted(HGSSSAV.TRANSFER_RESTRICTIONS, mon.dexNum, mon.formNum) &&
      mon.shinyLeaves !== undefined ? (
        <AttributeRow label="Shiny Leaves">
          {mon.shinyLeafValues?.crown ? (
            <img draggable={false} src={LeafCrown} style={leafCrownIconStyle} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'row' }}>
              <img
                draggable={false}
                src={ShinyLeaf}
                style={{
                  ...(mon.shinyLeafValues?.first
                    ? shinyLeafIconStyle
                    : shinyLeafEmptyIconStyle),
                  zIndex: 1,
                }}
              />
              <img
                draggable={false}
                src={ShinyLeaf}
                style={{
                  ...(mon.shinyLeafValues?.second
                    ? shinyLeafIconStyle
                    : shinyLeafEmptyIconStyle),
                  zIndex: 2,
                }}
              />
              <img
                draggable={false}
                src={ShinyLeaf}
                style={{
                  ...(mon.shinyLeafValues?.third
                    ? shinyLeafIconStyle
                    : shinyLeafEmptyIconStyle),
                  zIndex: 3,
                }}
              />
              <img
                draggable={false}
                src={ShinyLeaf}
                style={{
                  ...(mon.shinyLeafValues?.fourth
                    ? shinyLeafIconStyle
                    : shinyLeafEmptyIconStyle),
                  zIndex: 4,
                }}
              />
              <img
                draggable={false}
                src={ShinyLeaf}
                style={{
                  ...(mon.shinyLeafValues?.fifth
                    ? shinyLeafIconStyle
                    : shinyLeafEmptyIconStyle),
                  zIndex: 5,
                }}
              />
            </div>
          )}
        </AttributeRow>
      ) : (
        <div />
      )}
      {mon.isShiny ? (
        <AttributeRow
          label="SwSh Shiny Type"
          value={mon.isSquareShiny ? 'Square' : 'Star'}
        />
      ) : (
        <div />
      )}
      {mon.teraTypeOriginal !== undefined &&
      mon.teraTypeOverride !== undefined ? (
        <AttributeRow label="Tera Type">
          <img
            draggable={false}
            alt="tera type"
            style={{ height: 24, width: 24, marginRight: 5 }}
            src={`https://raw.githubusercontent.com/msikma/pokesprite/master/misc/types/gen8/${Types[
              mon.teraTypeOverride <= 18
                ? mon.teraTypeOverride
                : mon.teraTypeOriginal
            ]?.toLocaleLowerCase()}.png`}
          />
          {mon.teraTypeOverride <= 18 && (
            <>
              <p>(originally </p>
              <img
                alt="tera type original"
                style={{ height: 24, width: 24, marginRight: 5 }}
                src={`https://raw.githubusercontent.com/msikma/pokesprite/master/misc/types/gen8/${Types[
                  mon.teraTypeOriginal
                ]?.toLocaleLowerCase()}.png`}
              />
              <p>)</p>
            </>
          )}
        </AttributeRow>
      ) : (
        <div />
      )}
      {mon.dynamaxLevel !== undefined && (
        <AttributeRow label="Dynamax">
          <div style={{ display: 'flex', flexDirection: 'row' }}>
            {_.range(10).map((level: number) => (
              <div
                key={`dynamax_meter_${level}`}
                style={{
                  backgroundColor:
                    level < (mon.dynamaxLevel ?? 0)
                      ? `#FF${(40 + ((mon.dynamaxLevel ?? 0) - level) * 20)
                          ?.toString(16)
                          .padStart(2, '0')}00`
                      : 'grey',
                  height: 20,
                  width: 8,
                  marginRight: 4,
                }}
              ></div>
            ))}
          </div>
        </AttributeRow>
      )}
      {!isRestricted(G2SAV.TRANSFER_RESTRICTIONS, mon.dexNum, mon.formNum) &&
      (mon instanceof PK1 || mon instanceof PK2 || mon instanceof OHPKM) ? (
        <AttributeRow label="Gen 1/2 ID" value={getMonGen12Identifier(mon)} />
      ) : (
        <div />
      )}
      {!isRestricted(HGSSSAV.TRANSFER_RESTRICTIONS, mon.dexNum, mon.formNum) &&
      (mon instanceof PK3 || mon instanceof PK4 || mon instanceof OHPKM) ? (
        <AttributeRow label="Gen 3/4 ID" value={getMonGen34Identifier(mon)} />
      ) : (
        <div />
      )}
      {mon instanceof OHPKM ? (
        <AttributeRow label="OHPKM ID" value={getMonFileIdentifier(mon)} />
      ) : (
        <div />
      )}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
        }}
      >
        {mon.canGigantamax && (
          <AttributeTag icon={GMax} color="white" backgroundColor="#e60040" />
        )}
        {mon.isAlpha && (
          <AttributeTag icon={Alpha} color="white" backgroundColor="#f2352d" />
        )}
        {mon.isSquareShiny && (
          <AttributeTag
            label="SQUARE SHINY"
            color="white"
            backgroundColor="black"
          />
        )}
        {mon.isShadow && (
          <AttributeTag
            label="SHADOW"
            backgroundColor={getTypeColor('shadow')}
            color="white"
          />
        )}
        {mon.isNsPokemon && (
          <AttributeTag
            label="N's Pokémon"
            backgroundColor={'green'}
            color="white"
          />
        )}
      </div>
    </div>
  );
};
export default OtherDisplay;
