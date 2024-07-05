/* eslint-disable react/jsx-props-no-spreading */
import { ArrowForwardIosSharp } from '@mui/icons-material'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import { AllPKMFields, getDisplayID } from 'pokemon-files'
import {
  BDSPTMMoveIndexes,
  LATutorMoveIndexes,
  SVTMMoveIndexes,
  SwShTRMoveIndexes,
  isGen4,
} from 'pokemon-resources'
import { NationalDex } from 'pokemon-species-data'
import { useMemo } from 'react'
import { hasGen3OnData } from 'src/types/interfaces/gen3'
import { shinyLeafValues } from 'src/types/interfaces/gen4'
import { hasGen6OnData, hasN3DSOnlyData } from 'src/types/interfaces/gen6'
import { hasGen8OnData, hasGen8OnlyData } from 'src/types/interfaces/gen8'
import { Gen9OnlyData, hasGen9OnlyData } from 'src/types/interfaces/gen9'
import { get16BitChecksumLittleEndian } from 'src/util/ByteLogic'
import { Countries, EncounterTypes, SWEETS } from '../../consts'
import { MOVE_DATA } from '../../consts/Moves'
import {
  GEN2_TRANSFER_RESTRICTIONS,
  HGSS_TRANSFER_RESTRICTIONS,
  LA_TRANSFER_RESTRICTIONS,
  ORAS_TRANSFER_RESTRICTIONS,
  SV_TRANSFER_RESTRICTIONS,
  SWSH_TRANSFER_RESTRICTIONS,
  USUM_TRANSFER_RESTRICTIONS,
} from '../../consts/TransferRestrictions'
import { isRestricted } from '../../types/TransferRestrictions'
import { hasGameBoyData } from '../../types/interfaces/stats'
import { OHPKM } from '../../types/pkm'
import { getHiddenPowerGen2, getHiddenPowerPower, getHiddenPowerType } from '../../types/pkm/util'
import { Styles } from '../../types/types'
import {
  getMonFileIdentifier,
  getMonGen12Identifier,
  getMonGen345Identifier,
} from '../../util/Lookup'
import DynamaxLevel from '../components/DynamaxLevel'
import ShinyLeaves from '../components/ShinyLeaves'
import TypeIcon from '../components/TypeIcon'
import { getFlagsInRange } from '../util/byteLogic'
import AttributeRow from './AttributeRow'

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

const OtherDisplay = (props: { mon: AllPKMFields }) => {
  const { mon } = props
  return (
    <div style={styles.detailsPaneContent}>
      {mon.personalityValue && (
        <AttributeRow label="Personality Value">
          <code>{`0x${mon.personalityValue.toString(16).padStart(8, '0')}`}</code>
        </AttributeRow>
      )}
      {mon.encryptionConstant && (
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
        <AttributeRow label="ID" value={getDisplayID(mon as any)} indent={10} />
        {mon.secretID !== undefined && (
          <AttributeRow label="Secret ID" indent={10}>
            <code>{`0x${mon.secretID.toString(16).padStart(4, '0')}`}</code>
          </AttributeRow>
        )}
        {mon.trainerFriendship && (
          <AttributeRow label="Friendship" value={mon.trainerFriendship.toString()} indent={10} />
        )}
        {mon.trainerAffection && (
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
      {'personalityValue' in mon && mon.dexNum === NationalDex.Wurmple ? (
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
      {mon.formArgument && mon.dexNum === NationalDex.Alcremie ? (
        <AttributeRow label="Sweet" value={SWEETS[mon.formArgument]} />
      ) : (
        <div />
      )}
      {mon.personalityValue && mon.dexNum === NationalDex.Dunsparce ? (
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
      {mon.encryptionConstant !== undefined && mon.dexNum === NationalDex.Tandemaus && (
        <AttributeRow
          label="Maushold"
          value={mon.encryptionConstant % 100 ? 'Family of Four' : 'Family of Three'}
        />
      )}
      {mon.gameOfOrigin && isGen4(mon.gameOfOrigin) && mon.encounterType !== undefined && (
        <AttributeRow label="Gen 4 Encounter Type" value={EncounterTypes[mon.encounterType]} />
      )}
      {mon.shinyLeaves !== undefined &&
        !isRestricted(HGSS_TRANSFER_RESTRICTIONS, mon.dexNum, mon.formeNum) && (
          <AttributeRow label="Shiny Leaves">
            <ShinyLeaves {...shinyLeafValues(mon.shinyLeaves)} />
          </AttributeRow>
        )}
      {!isRestricted(USUM_TRANSFER_RESTRICTIONS, mon.dexNum, mon.formeNum) &&
      mon.geolocations &&
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
              value={mon.geolocations?.filter((geo) => geo.country).length.toString()}
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
      {!isRestricted(SWSH_TRANSFER_RESTRICTIONS, mon.dexNum, mon.formeNum) &&
      mon.trFlagsSwSh &&
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
      {!isRestricted(HGSS_TRANSFER_RESTRICTIONS, mon.dexNum, mon.formeNum) &&
      mon.tmFlagsBDSP &&
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
      {!isRestricted(LA_TRANSFER_RESTRICTIONS, mon.dexNum, mon.formeNum) &&
      mon.tutorFlagsLA &&
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

      {!isRestricted(SV_TRANSFER_RESTRICTIONS, mon.dexNum, mon.formeNum) &&
      mon.tmFlagsSV &&
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

      {(!isRestricted(SWSH_TRANSFER_RESTRICTIONS, mon.dexNum, mon.formeNum) ||
        !isRestricted(ORAS_TRANSFER_RESTRICTIONS, mon.dexNum, mon.formeNum)) &&
        mon.trainerMemory && (
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
              <AttributeRow label="Trainer Memory" value={mon.trainerName} />
            </AccordionSummary>
            <AttributeRow
              indent={10}
              label="Intensity"
              value={mon.trainerMemory.intensity.toString()}
            />
            <AttributeRow indent={10} label="Memory" value={mon.trainerMemory.memory.toString()} />
            <AttributeRow
              indent={10}
              label="Feeling"
              value={mon.trainerMemory.feeling.toString()}
            />
            <AttributeRow indent={10} label="Text Variables">
              <code>{`0x${mon.trainerMemory.textVariables.toString(16).padStart(4, '0')}`}</code>
            </AttributeRow>
          </Accordion>
        )}
      {(!isRestricted(SWSH_TRANSFER_RESTRICTIONS, mon.dexNum, mon.formeNum) ||
        !isRestricted(ORAS_TRANSFER_RESTRICTIONS, mon.dexNum, mon.formeNum)) &&
        mon.handlerMemory && (
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
              <AttributeRow label="Handler Memory" value={mon.handlerName} />
            </AccordionSummary>
            <AttributeRow
              indent={10}
              label="Intensity"
              value={mon.handlerMemory.intensity.toString()}
            />
            <AttributeRow indent={10} label="Memory" value={mon.handlerMemory.memory.toString()} />
            <AttributeRow
              indent={10}
              label="Feeling"
              value={mon.handlerMemory.feeling.toString()}
            />
            <AttributeRow indent={10} label="Text Variables">
              <code>{`0x${mon.handlerMemory.textVariables.toString(16).padStart(4, '0')}`}</code>
            </AttributeRow>
          </Accordion>
        )}
      {!isRestricted(SWSH_TRANSFER_RESTRICTIONS, mon.dexNum, mon.formeNum) &&
        hasGen8OnlyData(mon) && (
          <>
            <AttributeRow label="Dynamax">
              <DynamaxLevel level={mon.dynamaxLevel} />
            </AttributeRow>
            <AttributeRow label="Can Gigantimax" value={mon.canGigantamax ? 'true' : 'false'} />
            {mon.isShiny() && (
              <AttributeRow
                label="SwSh Shiny Type"
                value={mon.isSquareShiny() ? 'Square' : 'Star'}
              />
            )}
          </>
        )}
      {!isRestricted(SV_TRANSFER_RESTRICTIONS, mon.dexNum, mon.formeNum) &&
        hasGen9OnlyData(mon) && <ScarletVioletData mon={mon} />}
      {!isRestricted(GEN2_TRANSFER_RESTRICTIONS, mon.dexNum, mon.formeNum) &&
        hasGameBoyData(mon) && (
          <AttributeRow label="Gen 1/2 ID" value={getMonGen12Identifier(mon)} />
        )}
      {!isRestricted(HGSS_TRANSFER_RESTRICTIONS, mon.dexNum, mon.formeNum) &&
        hasGen3OnData(mon) && (
          <AttributeRow label="Gen 3/4/5 ID" value={getMonGen345Identifier(mon)} />
        )}
      {mon.checksum !== undefined && (
        <>
          <AttributeRow label="Checksum">
            <code>{`0x${mon.checksum.toString(16).padStart(4, '0')}`}</code>
          </AttributeRow>
          <AttributeRow label="Calced Checksum">
            <code>{`0x${get16BitChecksumLittleEndian(mon.toBytes(), 0x08, mon.toBytes().byteLength)
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

function HiddenPowerDisplay(props: { mon: AllPKMFields }) {
  const { mon } = props
  if (mon.ivs) {
    return (
      <AttributeRow label="Hidden Power">
        <TypeIcon type={getHiddenPowerType(mon.ivs)} />{' '}
        <p style={{ paddingLeft: 8 }}>{` ${getHiddenPowerPower(mon.ivs).toString()} Base Power`}</p>
      </AttributeRow>
    )
  }

  if (!mon.dvs) return undefined

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
