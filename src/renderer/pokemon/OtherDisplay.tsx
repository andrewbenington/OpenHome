/* eslint-disable react/jsx-props-no-spreading */
import { ArrowForwardIosSharp } from '@mui/icons-material'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import { hasGen3OnData } from 'src/types/interfaces/gen3'
import { hasGen4OnData, hasGen4OnlyData, shinyLeafValues } from 'src/types/interfaces/gen4'
import { hasGen6OnData, hasN3DSOnlyData } from 'src/types/interfaces/gen6'
import { hasGen8OnData, hasGen8OnlyData } from 'src/types/interfaces/gen8'
import { hasGen9OnlyData } from 'src/types/interfaces/gen9'
import { Countries, EncounterTypes, NDex, SWEETS } from '../../consts'
import {
  GEN2_TRANSFER_RESTRICTIONS,
  HGSS_TRANSFER_RESTRICTIONS,
  SV_TRANSFER_RESTRICTIONS,
  SWSH_TRANSFER_RESTRICTIONS,
  USUM_TRANSFER_RESTRICTIONS,
} from '../../consts/TransferRestrictions'
import { isRestricted } from '../../types/TransferRestrictions'
import { Styles } from '../../types/types'
import {
  getMonFileIdentifier,
  getMonGen12Identifier,
  getMonGen345Identifier,
} from '../../util/Lookup'
import DynamaxLevel from '../components/DynamaxLevel'
import ShinyLeaves from '../components/ShinyLeaves'
import TypeIcon from '../components/TypeIcon'
import AttributeRow from './AttributeRow'
import { PKM } from '../../types/PKMTypes/PKM'
import { hasGameBoyData } from '../../types/interfaces/stats'
import { OHPKM } from '../../types/PKMTypes'
import { get16BitChecksumLittleEndian } from 'src/util/ByteLogic'
import { isGen4 } from 'pokemon-resources'

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
    marginBottom: 10,
  },
} as Styles

const OtherDisplay = (props: { mon: PKM }) => {
  const { mon } = props
  return (
    <div style={styles.detailsPaneContent}>
      {'personalityValue' in mon && (
        <AttributeRow label="Personality Value">
          <code>{`0x${mon.personalityValue.toString(16).padStart(8, '0')}`}</code>
        </AttributeRow>
      )}
      {'encryptionConstant' in mon && (
        <AttributeRow label="Encryption Constant">
          <code>{`0x${mon.encryptionConstant.toString(16).padStart(8, '0')}`}</code>
        </AttributeRow>
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
        {mon.secretID !== undefined && (
          <AttributeRow label="Secret ID" indent={10}>
            <code>{`0x${mon.secretID.toString(16).padStart(4, '0')}`}</code>
          </AttributeRow>
        )}
        {'trainerFriendship' in mon && (
          <AttributeRow label="Friendship" value={mon.trainerFriendship.toString()} indent={10} />
        )}
        {'trainerAffection' in mon && (
          <AttributeRow label="Affection" value={mon.trainerAffection.toString()} indent={10} />
        )}
        {'isCurrentHandler' in mon && (
          <AttributeRow label="Trained last" value={`${!mon.isCurrentHandler}`} indent={10} />
        )}
      </Accordion>
      {hasGen6OnData(mon) && mon.handlerName !== '' ? (
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
          {hasGen8OnData(mon) && (
            <AttributeRow label="ID" value={mon.handlerID.toString()} indent={10} />
          )}
          <AttributeRow label="Friendship" value={mon.handlerFriendship.toString()} indent={10} />
          {hasN3DSOnlyData(mon) && (
            <AttributeRow label="Affection" value={mon.handlerAffection.toString()} indent={10} />
          )}
        </Accordion>
      ) : (
        <div />
      )}
      {hasGen3OnData(mon) && mon.dexNum === NDex.WURMPLE ? (
        <AttributeRow
          label="Wurmple Evolution"
          value={
            ((((hasGen6OnData(mon) ? mon.encryptionConstant : mon.personalityValue) ?? 0) >> 16) &
              0xffff) %
              10 >
            4
              ? 'Dustox'
              : 'Beautifly'
          }
        />
      ) : (
        <div />
      )}
      {hasGen6OnData(mon) && mon.dexNum === NDex.ALCREMIE ? (
        <AttributeRow label="Sweet" value={SWEETS[mon.formArgument]} />
      ) : (
        <div />
      )}
      {hasGen3OnData(mon) && mon.dexNum === NDex.DUNSPARCE ? (
        <AttributeRow
          label="Dudunsparce"
          value={
            (hasGen6OnData(mon) ? mon.encryptionConstant : mon.personalityValue) % 100
              ? 'Two-Segment'
              : 'Three-Segment'
          }
        />
      ) : (
        <div />
      )}
      {hasGen6OnData(mon) && mon.dexNum === NDex.TANDEMAUS && (
        <AttributeRow
          label="Maushold"
          value={mon.encryptionConstant % 100 ? 'Family of Four' : 'Family of Three'}
        />
      )}
      {hasGen4OnData(mon) && isGen4(mon.gameOfOrigin) && 'encounterType' in mon && (
        <AttributeRow label="Gen 4 Encounter Type" value={EncounterTypes[mon.encounterType]} />
      )}
      {hasGen4OnlyData(mon) &&
        !isRestricted(HGSS_TRANSFER_RESTRICTIONS, mon.dexNum, mon.formNum) && (
          <AttributeRow label="Shiny Leaves">
            <ShinyLeaves {...shinyLeafValues(mon)} />
          </AttributeRow>
        )}
      {!isRestricted(USUM_TRANSFER_RESTRICTIONS, mon.dexNum, mon.formNum) &&
      hasN3DSOnlyData(mon) &&
      mon.geolocations[0].country ? (
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
              value={mon.geolocations.filter((geo) => geo.country).length.toString()}
            />
          </AccordionSummary>
          {mon.geolocations?.map((geo, i) =>
            geo.country ? (
              <AttributeRow key={`geo_${i + 1}`} label={`Geolocation ${i + 1}`} indent={10}>
                {Countries[geo.country]}, Region {geo.region}
              </AttributeRow>
            ) : (
              <div key={`geo_${i + 1}`} />
            )
          )}
        </Accordion>
      ) : (
        <div />
      )}
      {!isRestricted(SWSH_TRANSFER_RESTRICTIONS, mon.dexNum, mon.formNum) &&
        hasGen8OnlyData(mon) && (
          <>
            <AttributeRow label="Dynamax">
              <DynamaxLevel level={mon.dynamaxLevel} />
            </AttributeRow>
            <AttributeRow label="Can Gigantimax" value={mon.canGigantamax ? 'true' : 'false'} />
            {mon.isShiny && (
              <AttributeRow label="SwSh Shiny Type" value={mon.isSquareShiny ? 'Square' : 'Star'} />
            )}
          </>
        )}
      {!isRestricted(SV_TRANSFER_RESTRICTIONS, mon.dexNum, mon.formNum) && hasGen9OnlyData(mon) && (
        <>
          <AttributeRow label="Tera Type">
            <TypeIcon
              typeIndex={mon.teraTypeOverride <= 18 ? mon.teraTypeOverride : mon.teraTypeOriginal}
            />
            {mon.teraTypeOverride <= 18 && (
              <>
                <p>(originally </p>
                <TypeIcon typeIndex={mon.teraTypeOriginal} />
                <p>)</p>
              </>
            )}
          </AttributeRow>
          <AttributeRow label="Obedience" value={mon.obedienceLevel.toString()} />
        </>
      )}
      {!isRestricted(GEN2_TRANSFER_RESTRICTIONS, mon.dexNum, mon.formNum) &&
        hasGameBoyData(mon) && (
          <AttributeRow label="Gen 1/2 ID" value={getMonGen12Identifier(mon)} />
        )}
      {!isRestricted(HGSS_TRANSFER_RESTRICTIONS, mon.dexNum, mon.formNum) && hasGen3OnData(mon) && (
        <AttributeRow label="Gen 3/4/5 ID" value={getMonGen345Identifier(mon)} />
      )}
      {'checksum' in mon && (
        <>
          <AttributeRow label="Checksum">
            <code>{`0x${mon.checksum.toString(16).padStart(4, '0')}`}</code>
          </AttributeRow>
          <AttributeRow label="Calced Checksum">
            <code>{`0x${get16BitChecksumLittleEndian(mon.bytes, 0x08, mon.bytes.length)
              .toString(16)
              .padStart(4, '0')}`}</code>
          </AttributeRow>
        </>
      )}
      {mon instanceof OHPKM && (
        <AttributeRow label="OpenHome ID" value={getMonFileIdentifier(mon)} />
      )}
    </div>
  )
}
export default OtherDisplay
