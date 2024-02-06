/* eslint-disable react/jsx-props-no-spreading */
import { ArrowForwardIosSharp } from '@mui/icons-material'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import { hasGen3OnData } from 'src/types/interfaces/gen3'
import { hasGen4OnData, hasGen4OnlyData, shinyLeafValues } from 'src/types/interfaces/gen4'
import { hasGen6OnData, hasN3DSOnlyData } from 'src/types/interfaces/gen6'
import { hasGen8OnData, hasGen8OnlyData } from 'src/types/interfaces/gen8'
import { Gen9OnlyData, hasGen9OnlyData } from 'src/types/interfaces/gen9'
import { Countries, EncounterTypes, MOVE_DATA, SWEETS } from '../../consts'
import {
  GEN2_TRANSFER_RESTRICTIONS,
  HGSS_TRANSFER_RESTRICTIONS,
  LA_TRANSFER_RESTRICTIONS,
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
import {
  getFlagsInRange,
  getHiddenPowerGen2,
  getHiddenPowerPower,
  getHiddenPowerType,
} from 'src/types/PKMTypes/util'
import { SwShTRMoveIndexes } from 'pokemon-resources'
import { BDSPTMMoveIndexes } from 'pokemon-resources'
import { LATutorMoveIndexes } from 'pokemon-resources'
import { SVTMMoveIndexes } from 'pokemon-resources'
import { useMemo } from 'react'
import { NationalDex } from 'pokemon-species-data'

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
      <HiddenPowerDisplay mon={mon} />
      {hasGen3OnData(mon) && mon.dexNum === NationalDex.Wurmple ? (
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
      {hasGen6OnData(mon) && mon.dexNum === NationalDex.Alcremie ? (
        <AttributeRow label="Sweet" value={SWEETS[mon.formArgument]} />
      ) : (
        <div />
      )}
      {hasGen3OnData(mon) && mon.dexNum === NationalDex.Dunsparce ? (
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
      {hasGen6OnData(mon) && mon.dexNum === NationalDex.Tandemaus && (
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
      'trFlagsSwSh' in mon &&
      getFlagsInRange(mon.trFlagsSwSh, 0, 14).length > 0 ? (
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
              label="SwSh TRs"
              value={`${getFlagsInRange(mon.trFlagsSwSh, 0, 14).length} TRs`}
            />
          </AccordionSummary>
          {getFlagsInRange(mon.trFlagsSwSh, 0, 14).map((i) => (
            <AttributeRow key={`swsh_tr_${i}`} label={`TR ${i}`} indent={10}>
              {MOVE_DATA[SwShTRMoveIndexes[i]].name}
            </AttributeRow>
          ))}
        </Accordion>
      ) : (
        <div />
      )}
      {!isRestricted(HGSS_TRANSFER_RESTRICTIONS, mon.dexNum, mon.formNum) &&
      'tmFlagsBDSP' in mon &&
      getFlagsInRange(mon.tmFlagsBDSP, 0, 14).length > 0 ? (
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
              label="BDSP TMs"
              value={`${getFlagsInRange(mon.tmFlagsBDSP, 0, 14).length} TMs`}
            />
          </AccordionSummary>
          {getFlagsInRange(mon.tmFlagsBDSP, 0, 14).map((i) => (
            <AttributeRow key={`bdsp_tm_${i + 1}`} label={`TM ${i + 1}`} indent={10}>
              {MOVE_DATA[BDSPTMMoveIndexes[i]].name}
            </AttributeRow>
          ))}
        </Accordion>
      ) : (
        <div />
      )}
      {!isRestricted(LA_TRANSFER_RESTRICTIONS, mon.dexNum, mon.formNum) &&
      'tutorFlagsLA' in mon &&
      getFlagsInRange(mon.tutorFlagsLA, 0, 8).length > 0 ? (
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
              label="LA Tutor Moves"
              value={`${getFlagsInRange(mon.tutorFlagsLA, 0, 8).length} Tutor Moves`}
            />
          </AccordionSummary>
          {getFlagsInRange(mon.tutorFlagsLA, 0, 8).map((i) => (
            <AttributeRow key={`la_tutor_${i + 1}`} label={`Tutor ${i + 1}`} indent={10}>
              {MOVE_DATA[LATutorMoveIndexes[i]].name}
            </AttributeRow>
          ))}
        </Accordion>
      ) : (
        <div />
      )}

      {!isRestricted(SV_TRANSFER_RESTRICTIONS, mon.dexNum, mon.formNum) &&
      'tmFlagsSV' in mon &&
      getFlagsInRange(mon.tmFlagsSV, 0, 22).length > 0 ? (
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
              label="SV TMs"
              value={`${getFlagsInRange(mon.tmFlagsSV, 0, 22).length} TMs`}
            />
          </AccordionSummary>
          {getFlagsInRange(mon.tmFlagsSV, 0, 22).map((i) => (
            <AttributeRow key={`sv_tm_${i}`} label={`TM ${i}`} indent={10}>
              {MOVE_DATA[SVTMMoveIndexes[i]].name}
            </AttributeRow>
          ))}
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
        <ScarletVioletData mon={mon} />
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

function ScarletVioletData(props: { mon: Gen9OnlyData }) {
  const { mon } = props

  const currentTeraType = useMemo(
    () => (mon.teraTypeOverride <= 18 ? mon.teraTypeOverride : mon.teraTypeOriginal),
    [mon.teraTypeOriginal, mon.teraTypeOverride]
  )

  const previousTeraType = useMemo(
    () => (mon.teraTypeOverride <= 18 ? mon.teraTypeOriginal : undefined),
    [mon.teraTypeOriginal, mon.teraTypeOverride]
  )

  return (
    <>
      <AttributeRow label="Tera Type">
        <TypeIcon typeIndex={currentTeraType} />
        {previousTeraType && (
          <>
            <p>(originally </p>
            <TypeIcon typeIndex={previousTeraType} />
            <p>)</p>
          </>
        )}
      </AttributeRow>
      <AttributeRow label="Obedience" value={mon.obedienceLevel.toString()} />
    </>
  )
}

function HiddenPowerDisplay(props: { mon: PKM }) {
  const { mon } = props
  if (!('dvs' in mon)) {
    return (
      <AttributeRow label="Hidden Power">
        <TypeIcon type={getHiddenPowerType(mon.ivs)} />{' '}
        <p style={{ paddingLeft: 8 }}>{` ${getHiddenPowerPower(mon.ivs).toString()} Base Power`}</p>
      </AttributeRow>
    )
  }

  const { type: g2type, power: g2power } = getHiddenPowerGen2(mon.dvs)

  if (mon instanceof OHPKM) {
    return (
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
          <AttributeRow label="Hidden Power">
            <TypeIcon type={getHiddenPowerType(mon.ivs)} />
          </AttributeRow>
        </AccordionSummary>
        <AttributeRow label="Gen 2" indent={10}>
          <TypeIcon type={g2type} /> <p style={{ paddingLeft: 8 }}>{` ${g2power} Base Power`}</p>
        </AttributeRow>
        <AttributeRow
          label="Power (Gen 3-5)"
          value={getHiddenPowerPower(mon.ivs).toString()}
          indent={10}
        />
      </Accordion>
    )
  }

  return (
    <AttributeRow label="Hidden Power">
      <TypeIcon type={g2type} /> <p style={{ paddingLeft: 8 }}>{` ${g2power} Base Power`}</p>
    </AttributeRow>
  )
}
