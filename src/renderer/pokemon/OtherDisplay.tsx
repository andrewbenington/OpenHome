import { ArrowForwardIosSharp } from '@mui/icons-material';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import { GameOfOrigin, isAlola, isGen6, isGen7 } from 'consts';
import Countries from 'consts/Countries';
import Types from 'consts/Types';
import _ from 'lodash';
import { OHPKM, PK1, PK2, PK3, PK4, PKM } from 'types/PKMTypes';
import { getSixDigitTID } from 'types/PKMTypes/util';
import { G2SAV } from 'types/SAVTypes/G2SAV';
import { HGSSSAV } from 'types/SAVTypes/HGSSSAV';
import { isRestricted } from 'types/TransferRestrictions';
import {
  getMonFileIdentifier,
  getMonGen12Identifier,
  getMonGen34Identifier,
} from 'util/Lookup';
import Alpha from '../images/icons/Alpha.png';
import GMax from '../images/icons/GMax.png';
import LeafCrown from '../images/icons/LeafCrown.png';
import ShinyLeaf from '../images/icons/ShinyLeaf.png';
import { getTypeColor } from '../util/PokemonSprite';
import AttributeRow from './AttributeRow';
import AttributeTag from './AttributeTag';
import {
  accordionStyle,
  accordionSummaryStyle,
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
        <AttributeRow label="Personality Value">
          <code>
            {'0x' + mon.personalityValue.toString(16).padStart(8, '0')}
          </code>
        </AttributeRow>
      ) : (
        <div />
      )}
      {mon.encryptionConstant !== undefined ? (
        <AttributeRow label="Encryption Constant">
          <code>
            {'0x' + mon.encryptionConstant.toString(16).padStart(8, '0')}
          </code>
        </AttributeRow>
      ) : (
        <div />
      )}
      <Accordion
        disableGutters
        elevation={0}
        TransitionProps={{ unmountOnExit: true }}
        sx={accordionStyle}
      >
        <AccordionSummary
          expandIcon={<ArrowForwardIosSharp sx={{ fontSize: '0.9rem' }} />}
          sx={accordionSummaryStyle}
        >
          <AttributeRow
            label="Original Trainer"
            value={`${mon.trainerName} ${mon.trainerGender ? '♀' : '♂'}`}
          />
        </AccordionSummary>
        <AttributeRow label="ID" value={mon.displayID.toString()} indent={10} />
        {mon.secretID !== undefined ? (
          <AttributeRow label="Secret ID" indent={10}>
            <code>{'0x' + mon.secretID.toString(16).padStart(4, '0')}</code>
          </AttributeRow>
        ) : (
          <div />
        )}
        {mon.trainerFriendship !== undefined ? (
          <AttributeRow
            label="Friendship"
            value={mon.trainerFriendship.toString()}
            indent={10}
          />
        ) : (
          <div />
        )}
        {mon.trainerAffection !== undefined &&
        (isGen6(mon.gameOfOrigin) || isAlola(mon.gameOfOrigin)) ? (
          <AttributeRow
            label="Affection"
            value={mon.trainerAffection.toString()}
            indent={10}
          />
        ) : (
          <div />
        )}
      </Accordion>
      {mon.handlerName ? (
        <Accordion
          disableGutters
          elevation={0}
          TransitionProps={{ unmountOnExit: true }}
          sx={accordionStyle}
        >
          <AccordionSummary
            expandIcon={<ArrowForwardIosSharp sx={{ fontSize: '0.9rem' }} />}
            sx={accordionSummaryStyle}
          >
            <AttributeRow
              label="Recent Trainer"
              value={`${mon.handlerName} ${mon.handlerGender ? '♀' : '♂'}`}
            />
          </AccordionSummary>
          {mon.handlerID !== undefined ? (
            <AttributeRow
              label="ID"
              value={mon.handlerID.toString()}
              indent={10}
            />
          ) : (
            <div />
          )}
          {mon.handlerFriendship !== undefined ? (
            <AttributeRow
              label="Friendship"
              value={mon.handlerFriendship.toString()}
              indent={10}
            />
          ) : (
            <div />
          )}
          {mon.handlerAffection !== undefined ? (
            <AttributeRow
              label="Affection"
              value={mon.handlerAffection.toString()}
              indent={10}
            />
          ) : (
            <div />
          )}
        </Accordion>
      ) : (
        <div />
      )}
      {mon.dexNum >= 265 && mon.dexNum <= 269 ? (
        <AttributeRow
          label="Wurmple Evolution"
          value={
            (((mon.encryptionConstant ?? 0) >> 16) & 0xffff) % 10 > 4
              ? 'Dustox'
              : 'Beautifly'
          }
        />
      ) : (
        <div />
      )}
      {mon.dexNum === 206 && mon.encryptionConstant ? (
        <AttributeRow
          label="Dudunsparce"
          value={mon.encryptionConstant % 100 ? 'Two-Segment' : 'Three-Segment'}
        />
      ) : (
        <div />
      )}
      {mon.dexNum === 924 && mon.encryptionConstant ? (
        <AttributeRow
          label="Maushold"
          value={
            mon.encryptionConstant % 100 ? 'Family of Four' : 'Family of Three'
          }
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

      {mon.geolocations && mon.geolocations[0].country ? (
        <Accordion
          disableGutters
          elevation={0}
          TransitionProps={{ unmountOnExit: true }}
          sx={accordionStyle}
        >
          <AccordionSummary
            expandIcon={<ArrowForwardIosSharp sx={{ fontSize: '0.9rem' }} />}
            sx={accordionSummaryStyle}
          >
            <AttributeRow
              label="Geolocations"
              value={mon.geolocations
                .filter((geo) => geo.country)
                .length.toString()}
            />
          </AccordionSummary>
          {mon.geolocations?.map((geo, i) =>
            geo.country ? (
              <AttributeRow
                key={`geo_${i + 1}`}
                label={`Geolocation ${i + 1}`}
                indent={10}
              >
                {Countries[geo.country]}, Region {geo.region}
              </AttributeRow>
            ) : (
              <div />
            )
          )}
        </Accordion>
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
        <AttributeRow label="OpenHome ID" value={getMonFileIdentifier(mon)} />
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
