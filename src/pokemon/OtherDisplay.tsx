import { Flex } from '@radix-ui/themes'
import { AllPKMFields, getDisplayID, StatsPreSplit } from 'pokemon-files'
import {
  BDSPTMMoveIndexes,
  isGen4,
  LATutorMoveIndexes,
  Moves,
  SVTMMoveIndexes,
  SwShTRMoveIndexes,
} from 'pokemon-resources'
import { NationalDex } from 'pokemon-species-data'
import { useMemo } from 'react'
import { Countries } from 'src/consts/Countries'
import { EncounterTypes } from 'src/consts/EncounterTypes'
import { SWEETS } from 'src/consts/Formes'
import {
  GEN2_TRANSFER_RESTRICTIONS,
  HGSS_TRANSFER_RESTRICTIONS,
  LA_TRANSFER_RESTRICTIONS,
  ORAS_TRANSFER_RESTRICTIONS,
  SV_TRANSFER_RESTRICTIONS,
  SWSH_TRANSFER_RESTRICTIONS,
  USUM_TRANSFER_RESTRICTIONS,
} from 'src/consts/TransferRestrictions'
import {
  getMonFileIdentifier,
  getMonGen12Identifier,
  getMonGen345Identifier,
} from 'src/util/Lookup'
import { get16BitChecksumLittleEndian } from 'src/util/byteLogic'
import DynamaxLevel from '../components/DynamaxLevel'
import ShinyLeaves from '../components/ShinyLeaves'
import TypeIcon from '../components/TypeIcon'
import { isRestricted } from '../types/TransferRestrictions'
import { PKMInterface } from '../types/interfaces'
import { OHPKM } from '../types/pkm/OHPKM'
import {
  getHiddenPowerGen2,
  getHiddenPowerPower,
  getHiddenPowerType,
  shinyLeafValues,
} from '../types/pkm/util'
import { getFlagsInRange } from '../util/byteLogic'
import AttributeRow from './AttributeRow'
import AttributeRowExpand from './AttributeRowExpand'

const OtherDisplay = (props: { mon: PKMInterface }) => {
  const { mon } = props

  return (
    <div style={{ overflow: 'hidden', height: '100%' }}>
      <Flex
        direction="column"
        gap="2px"
        style={{
          height: '100%',
          padding: 8,
          overflowY: 'auto',
        }}
      >
        {mon.personalityValue !== undefined && (
          <AttributeRow label="Personality Value">
            <code>{`0x${mon.personalityValue.toString(16).padStart(8, '0')}`}</code>
          </AttributeRow>
        )}
        {mon.encryptionConstant !== undefined && (
          <AttributeRow label="Encryption Constant">
            <code>{`0x${mon.encryptionConstant.toString(16).padStart(8, '0')}`}</code>
          </AttributeRow>
        )}
        <AttributeRowExpand
          summary="Original Trainer"
          value={`${mon.trainerName} ${mon.trainerGender ? '♀' : '♂'}`}
        >
          <AttributeRow label="ID" value={getDisplayID(mon as any)} indent={10} />
          {mon.secretID !== undefined && (
            <AttributeRow label="Secret ID" indent={10}>
              <code>{`0x${mon.secretID.toString(16).padStart(4, '0')}`}</code>
            </AttributeRow>
          )}
          {!!mon.trainerFriendship && (
            <AttributeRow label="Friendship" value={mon.trainerFriendship.toString()} indent={10} />
          )}
          {!!mon.trainerAffection && (
            <AttributeRow label="Affection" value={mon.trainerAffection.toString()} indent={10} />
          )}
          {'isCurrentHandler' in mon && (
            <AttributeRow label="Trained last" value={`${!mon.isCurrentHandler}`} indent={10} />
          )}
        </AttributeRowExpand>
        {mon.handlerName && (
          <AttributeRowExpand
            summary="Recent Trainer"
            value={`${mon.handlerName} ${mon.handlerGender ? '♀' : '♂'}`}
          >
            {mon.handlerFriendship !== undefined && (
              <AttributeRow
                label="Friendship"
                value={mon.handlerFriendship.toString()}
                indent={10}
              />
            )}
            {mon.handlerAffection !== undefined && (
              <AttributeRow label="Affection" value={mon.handlerAffection.toString()} indent={10} />
            )}
          </AttributeRowExpand>
        )}
        <HiddenPowerDisplay mon={mon} />
        {mon.personalityValue !== undefined && mon.dexNum === NationalDex.Wurmple && (
          <AttributeRow
            label="Wurmple Evolution"
            value={
              ((((mon.encryptionConstant !== undefined
                ? mon.encryptionConstant
                : mon.personalityValue) ?? 0) >>
                16) &
                0xffff) %
                10 >
              4
                ? 'Dustox'
                : 'Beautifly'
            }
          />
        )}
        {mon.formArgument !== undefined && mon.dexNum === NationalDex.Alcremie && (
          <AttributeRow label="Sweet" value={SWEETS[mon.formArgument]} />
        )}
        {mon.personalityValue !== undefined && mon.dexNum === NationalDex.Dunsparce && (
          <AttributeRow
            label="Dudunsparce"
            value={
              (mon.encryptionConstant !== undefined
                ? mon.encryptionConstant
                : mon.personalityValue) % 100
                ? 'Two-Segment'
                : 'Three-Segment'
            }
          />
        )}
        {mon.encryptionConstant !== undefined && mon.dexNum === NationalDex.Tandemaus && (
          <AttributeRow
            label="Maushold"
            value={mon.encryptionConstant % 100 ? 'Family of Four' : 'Family of Three'}
          />
        )}
        {isGen4(mon.gameOfOrigin) && mon.encounterType !== undefined && (
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
          mon.geolocations[0].country > 0 && (
            <AttributeRowExpand
              summary="Geolocations"
              value={mon.geolocations?.filter((geo) => geo.country).length.toString()}
            >
              {mon.geolocations?.map((geo, i) =>
                geo.country ? (
                  <AttributeRow key={`geo_${i + 1}`} label={`Geolocation ${i + 1}`} indent={10}>
                    {Countries[geo.country]}, Region {geo.region}
                  </AttributeRow>
                ) : (
                  <div key={`geo_${i + 1}`} />
                )
              )}
            </AttributeRowExpand>
          )}
        {!isRestricted(SWSH_TRANSFER_RESTRICTIONS, mon.dexNum, mon.formeNum) &&
          mon.trFlagsSwSh &&
          getFlagsInRange(mon.trFlagsSwSh, 0, 14).length > 0 && (
            <AttributeRowExpand
              summary="SwSh TRs"
              value={`${getFlagsInRange(mon.trFlagsSwSh, 0, 14).length} TRs`}
            >
              {getFlagsInRange(mon.trFlagsSwSh, 0, 14).map((i) => (
                <AttributeRow key={`swsh_tr_${i}`} label={`TR ${i}`} indent={10}>
                  {Moves[SwShTRMoveIndexes[i]].name}
                </AttributeRow>
              ))}
            </AttributeRowExpand>
          )}
        {!isRestricted(HGSS_TRANSFER_RESTRICTIONS, mon.dexNum, mon.formeNum) &&
          mon.tmFlagsBDSP &&
          getFlagsInRange(mon.tmFlagsBDSP, 0, 14).length > 0 && (
            <AttributeRowExpand
              summary="BDSP TMs"
              value={`${getFlagsInRange(mon.tmFlagsBDSP, 0, 14).length} TMs`}
            >
              {getFlagsInRange(mon.tmFlagsBDSP, 0, 14).map((i) => (
                <AttributeRow key={`bdsp_tm_${i + 1}`} label={`TM ${i + 1}`} indent={10}>
                  {Moves[BDSPTMMoveIndexes[i]].name}
                </AttributeRow>
              ))}
            </AttributeRowExpand>
          )}
        {!isRestricted(LA_TRANSFER_RESTRICTIONS, mon.dexNum, mon.formeNum) &&
          mon.tutorFlagsLA &&
          getFlagsInRange(mon.tutorFlagsLA, 0, 8).length > 0 && (
            <AttributeRowExpand
              summary="LA Tutor Moves"
              value={`${getFlagsInRange(mon.tutorFlagsLA, 0, 8).length} Tutor Moves`}
            >
              {getFlagsInRange(mon.tutorFlagsLA, 0, 8).map((i) => (
                <AttributeRow key={`la_tutor_${i + 1}`} label={`Tutor ${i + 1}`} indent={10}>
                  {Moves[LATutorMoveIndexes[i]].name}
                </AttributeRow>
              ))}
            </AttributeRowExpand>
          )}

        {!isRestricted(SV_TRANSFER_RESTRICTIONS, mon.dexNum, mon.formeNum) &&
          mon.tmFlagsSV &&
          getFlagsInRange(mon.tmFlagsSV, 0, 22).length > 0 && (
            <AttributeRowExpand
              summary="SV TMs"
              value={`${getFlagsInRange(mon.tmFlagsSV, 0, 22).length} TMs`}
            >
              {getFlagsInRange(mon.tmFlagsSV, 0, 22).map((i) => (
                <AttributeRow key={`sv_tm_${i}`} label={`TM ${i}`} indent={10}>
                  {Moves[SVTMMoveIndexes[i]].name}
                </AttributeRow>
              ))}
            </AttributeRowExpand>
          )}

        {(!isRestricted(SWSH_TRANSFER_RESTRICTIONS, mon.dexNum, mon.formeNum) ||
          !isRestricted(ORAS_TRANSFER_RESTRICTIONS, mon.dexNum, mon.formeNum)) &&
          mon.trainerMemory && (
            <AttributeRowExpand summary="Trainer Memory" value={mon.trainerName}>
              <AttributeRow
                indent={10}
                label="Intensity"
                value={mon.trainerMemory.intensity.toString()}
              />
              <AttributeRow
                indent={10}
                label="Memory"
                value={mon.trainerMemory.memory.toString()}
              />
              <AttributeRow
                indent={10}
                label="Feeling"
                value={mon.trainerMemory.feeling.toString()}
              />
              <AttributeRow indent={10} label="Text Variables">
                <code>{`0x${mon.trainerMemory.textVariables.toString(16).padStart(4, '0')}`}</code>
              </AttributeRow>
            </AttributeRowExpand>
          )}
        {(!isRestricted(SWSH_TRANSFER_RESTRICTIONS, mon.dexNum, mon.formeNum) ||
          !isRestricted(ORAS_TRANSFER_RESTRICTIONS, mon.dexNum, mon.formeNum)) &&
          mon.handlerMemory && (
            <AttributeRowExpand summary="Handler Memory" value={mon.handlerName}>
              <AttributeRow
                indent={10}
                label="Intensity"
                value={mon.handlerMemory.intensity.toString()}
              />
              <AttributeRow
                indent={10}
                label="Memory"
                value={mon.handlerMemory.memory.toString()}
              />
              <AttributeRow
                indent={10}
                label="Feeling"
                value={mon.handlerMemory.feeling.toString()}
              />
              <AttributeRow indent={10} label="Text Variables">
                <code>{`0x${mon.handlerMemory.textVariables.toString(16).padStart(4, '0')}`}</code>
              </AttributeRow>
            </AttributeRowExpand>
          )}
        {!isRestricted(SWSH_TRANSFER_RESTRICTIONS, mon.dexNum, mon.formeNum) &&
          mon.dynamaxLevel !== undefined && (
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
        {!isRestricted(SV_TRANSFER_RESTRICTIONS, mon.dexNum, mon.formeNum) && hasTeraTypes(mon) && (
          <TeraTypeData mon={mon} />
        )}
        {!isRestricted(SV_TRANSFER_RESTRICTIONS, mon.dexNum, mon.formeNum) &&
          mon.obedienceLevel !== undefined && (
            <AttributeRow label="Obedience" value={mon.obedienceLevel.toString()} />
          )}
        {!isRestricted(GEN2_TRANSFER_RESTRICTIONS, mon.dexNum, mon.formeNum) &&
          mon.dvs !== undefined && (
            <AttributeRow
              label="Gen 1/2 ID"
              value={getMonGen12Identifier(mon as PKMInterface & { dvs: StatsPreSplit })}
            />
          )}
        {!isRestricted(HGSS_TRANSFER_RESTRICTIONS, mon.dexNum, mon.formeNum) &&
          mon.personalityValue !== undefined && (
            <AttributeRow label="Gen 3/4/5 ID" value={getMonGen345Identifier(mon)} />
          )}
        {mon.checksum !== undefined && (
          <>
            <AttributeRow label="Checksum">
              <code>{`0x${mon.checksum.toString(16).padStart(4, '0')}`}</code>
            </AttributeRow>
            <AttributeRow label="Calced Checksum">
              <code>{`0x${get16BitChecksumLittleEndian(
                mon.toBytes(),
                0x08,
                mon.toBytes().byteLength
              )
                .toString(16)
                .padStart(4, '0')}`}</code>
            </AttributeRow>
          </>
        )}
        {mon instanceof OHPKM && (
          <AttributeRow label="OpenHome ID" value={getMonFileIdentifier(mon)} />
        )}
      </Flex>
    </div>
  )
}

export default OtherDisplay

type PKMInterfaceTera = PKMInterface & {
  teraTypeOriginal: number
  teraTypeOverride: number
}

function hasTeraTypes(mon: PKMInterface): mon is PKMInterfaceTera {
  return mon.teraTypeOriginal !== undefined && mon.teraTypeOverride !== undefined
}

function TeraTypeData(props: { mon: PKMInterfaceTera }) {
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
    <AttributeRow label="Tera Type">
      <TypeIcon typeIndex={currentTeraType} />
      {previousTeraType && (
        <>
          <div>(originally </div>
          <TypeIcon typeIndex={previousTeraType} />
          <div>)</div>
        </>
      )}
    </AttributeRow>
  )
}

function HiddenPowerDisplay(props: { mon: AllPKMFields }) {
  const { mon } = props

  if (mon.ivs) {
    return (
      <AttributeRow label="Hidden Power">
        <TypeIcon type={getHiddenPowerType(mon.ivs)} />{' '}
        <div style={{ paddingLeft: 8 }}>{` ${getHiddenPowerPower(
          mon.ivs
        ).toString()} Base Power`}</div>
      </AttributeRow>
    )
  }

  if (!mon.dvs) return undefined

  const { type: g2type, power: g2power } = getHiddenPowerGen2(mon.dvs)

  if (mon instanceof OHPKM) {
    return (
      <AttributeRowExpand summary="Hidden Power">
        <TypeIcon type={getHiddenPowerType(mon.ivs)} />

        <AttributeRow label="Gen 2" indent={10}>
          <TypeIcon type={g2type} /> <p style={{ paddingLeft: 8 }}>{` ${g2power} Base Power`}</p>
        </AttributeRow>
        <AttributeRow
          label="Power (Gen 3-5)"
          value={getHiddenPowerPower(mon.ivs).toString()}
          indent={10}
        />
      </AttributeRowExpand>
    )
  }

  return (
    <AttributeRow label="Hidden Power">
      <TypeIcon type={g2type} /> <p style={{ paddingLeft: 8 }}>{` ${g2power} Base Power`}</p>
    </AttributeRow>
  )
}
