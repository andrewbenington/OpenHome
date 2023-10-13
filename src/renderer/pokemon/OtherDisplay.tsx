/* eslint-disable react/jsx-props-no-spreading */
import { ArrowForwardIosSharp } from '@mui/icons-material'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import { Countries, NDex, SWEETS, isAlola, isGen6 } from 'consts'
import {
  GEN2_TRANSFER_RESTRICTIONS,
  HGSS_TRANSFER_RESTRICTIONS,
} from 'consts/TransferRestrictions'
import DynamaxLevel from 'renderer/components/DynamaxLevel'
import ShinyLeaves from 'renderer/components/ShinyLeaves'
import TypeIcon from 'renderer/components/TypeIcon'
import { OHPKM, PK1, PK2, PK3, PK4, PK5, PKM } from 'types/PKMTypes'
import { isRestricted } from 'types/TransferRestrictions'
import { Styles } from 'types/types'
import {
  getMonFileIdentifier,
  getMonGen12Identifier,
  getMonGen345Identifier,
} from 'util/Lookup'
import Alpha from '../images/icons/Alpha.png'
import GMax from '../images/icons/GMax.png'
import { getTypeColor } from '../util/PokemonSprite'
import AttributeRow from './AttributeRow'
import AttributeTag from './AttributeTag'

const styles = {
  accordion: {
    backgroundColor: '#0000',
    '&:before': {
      display: 'none',
    },
  },
  accordionSummary: {
    backgroundColor: '#0000',
    padding: 0,
    minHeight: 'fit-content',
    '& .MuiAccordionSummary-content': {
      margin: 0,
    },
    '& .MuiAccordionSummary-expandIconWrapper': {
      position: 'absolute',
      right: 10,
    },
    '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
      transform: 'rotate(90deg)',
    },
  },
  flexRowWrap: {
    display: 'flex',
    flexDirection: 'row' as 'row',
    flexWrap: 'wrap' as 'wrap',
  },
  detailsPaneContent: {
    display: 'flex',
    flexDirection: 'column' as 'column',
    height: 'calc(100% - 20px)',
    padding: 10,
  },
} as Styles

const OtherDisplay = (props: { mon: PKM }) => {
  const { mon } = props
  return (
    <div style={styles.detailsPaneContent}>
      {mon.personalityValue !== undefined ? (
        <AttributeRow label="Personality Value">
          <code>
            {`0x${mon.personalityValue.toString(16).padStart(8, '0')}`}
          </code>
        </AttributeRow>
      ) : (
        <div />
      )}
      {mon.encryptionConstant !== undefined ? (
        <AttributeRow label="Encryption Constant">
          <code>
            {`0x${mon.encryptionConstant.toString(16).padStart(8, '0')}`}
          </code>
        </AttributeRow>
      ) : (
        <div />
      )}
      <Accordion
        disableGutters
        elevation={0}
        TransitionProps={{ unmountOnExit: true }}
        sx={styles.accordion}
      >
        <AccordionSummary
          expandIcon={<ArrowForwardIosSharp sx={{ fontSize: '0.9rem' }} />}
          sx={styles.accordionSummary}
        >
          <AttributeRow
            label="Original Trainer"
            value={`${mon.trainerName} ${mon.trainerGender ? '♀' : '♂'}`}
          />
        </AccordionSummary>
        <AttributeRow label="ID" value={mon.displayID.toString()} indent={10} />
        {mon.secretID !== undefined ? (
          <AttributeRow label="Secret ID" indent={10}>
            <code>{`0x${mon.secretID.toString(16).padStart(4, '0')}`}</code>
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
          sx={styles.accordion}
        >
          <AccordionSummary
            expandIcon={<ArrowForwardIosSharp sx={{ fontSize: '0.9rem' }} />}
            sx={styles.accordionSummary}
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
      {mon.dexNum === NDex.WURMPLE ? (
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
      {mon.dexNum === NDex.ALCREMIE && mon.formArgument ? (
        <AttributeRow label="Sweet" value={SWEETS[mon.formArgument]} />
      ) : (
        <div />
      )}
      {mon.dexNum === NDex.DUNSPARCE && mon.encryptionConstant ? (
        <AttributeRow
          label="Dudunsparce"
          value={mon.encryptionConstant % 100 ? 'Two-Segment' : 'Three-Segment'}
        />
      ) : (
        <div />
      )}
      {mon.dexNum === NDex.TANDEMAUS && mon.encryptionConstant ? (
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
      {!isRestricted(HGSS_TRANSFER_RESTRICTIONS, mon.dexNum, mon.formNum) &&
      mon.shinyLeafValues !== undefined ? (
        <AttributeRow label="Shiny Leaves">
          <ShinyLeaves {...mon.shinyLeafValues} />
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
          sx={styles.accordion}
        >
          <AccordionSummary
            expandIcon={<ArrowForwardIosSharp sx={{ fontSize: '0.9rem' }} />}
            sx={styles.accordionSummary}
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
          <DynamaxLevel level={mon.dynamaxLevel} />
        </AttributeRow>
      )}
      {mon.teraTypeOriginal !== undefined &&
      mon.teraTypeOverride !== undefined ? (
        <AttributeRow label="Tera Type">
          <TypeIcon
            typeIndex={
              mon.teraTypeOverride <= 18
                ? mon.teraTypeOverride
                : mon.teraTypeOriginal
            }
          />
          {mon.teraTypeOverride <= 18 && (
            <>
              <p>(originally </p>
              <TypeIcon typeIndex={mon.teraTypeOriginal} />
              <p>)</p>
            </>
          )}
        </AttributeRow>
      ) : (
        <div />
      )}
      {!isRestricted(GEN2_TRANSFER_RESTRICTIONS, mon.dexNum, mon.formNum) &&
      (mon instanceof PK1 || mon instanceof PK2 || mon instanceof OHPKM) ? (
        <AttributeRow label="Gen 1/2 ID" value={getMonGen12Identifier(mon)} />
      ) : (
        <div />
      )}
      {!isRestricted(HGSS_TRANSFER_RESTRICTIONS, mon.dexNum, mon.formNum) &&
      (mon instanceof PK3 ||
        mon instanceof PK4 ||
        mon instanceof PK5 ||
        mon instanceof OHPKM) ? (
        <AttributeRow
          label="Gen 3/4/5 ID"
          value={getMonGen345Identifier(mon)}
        />
      ) : (
        <div />
      )}
      {mon instanceof OHPKM ? (
        <AttributeRow label="OpenHome ID" value={getMonFileIdentifier(mon)} />
      ) : (
        <div />
      )}
      <div style={styles.flexRowWrap}>
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
            backgroundColor="green"
            color="white"
          />
        )}
      </div>
    </div>
  )
}
export default OtherDisplay
