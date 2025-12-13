import { genderFromBool, Generation, OriginGames } from '@pkm-rs/pkg'
import { PK3, PK4, PK5 } from '@pokemon-files/pkm'
import { AllPKMFields, getDisplayID, StatsPreSplit } from '@pokemon-files/util'
import {
  BDSPTMMoveIndexes,
  LATutorMoveIndexes,
  Moves,
  SVTMMoveIndexes,
  SwShTRMoveIndexes,
} from '@pokemon-resources/index'
import { Flex } from '@radix-ui/themes'
import { useMemo } from 'react'
import GenderIcon from 'src/components/GenderIcon'
import { Countries } from 'src/consts/Countries'
import { EncounterTypes } from 'src/consts/EncounterTypes'
import { SWEETS } from 'src/consts/Formes'
import { NationalDex } from 'src/consts/NationalDex'
import {
  GEN2_TRANSFER_RESTRICTIONS,
  HGSS_TRANSFER_RESTRICTIONS,
  LA_TRANSFER_RESTRICTIONS,
  ORAS_TRANSFER_RESTRICTIONS,
  SV_TRANSFER_RESTRICTIONS_ID,
  SWSH_TRANSFER_RESTRICTIONS_CT,
  USUM_TRANSFER_RESTRICTIONS,
} from 'src/consts/TransferRestrictions'
import {
  getMonFileIdentifier,
  getMonGen12Identifier,
  getMonGen345Identifier,
} from 'src/util/Lookup'
import DynamaxLevel from '../../components/DynamaxLevel'
import ShinyLeavesDisplay from '../../components/ShinyLeaves'
import TypeIcon from '../../components/TypeIcon'
import useIsDev from '../../hooks/isDev'
import { isRestricted } from '../../types/TransferRestrictions'
import { PKMInterface } from '../../types/interfaces'
import { OHPKM } from '../../types/pkm/OHPKM'
import {
  getHiddenPowerGen2,
  getHiddenPowerPower,
  getHiddenPowerType,
  getWeightCalculated,
} from '../../types/pkm/util'
import { getFlagsInRange } from '../../util/byteLogic'
import AttributeRow from '../components/AttributeRow'
import AttributeRowExpand from '../components/AttributeRowExpand'

const HG_TO_LB = 0.2204623
const CM_TO_IN = 0.3937008

const OtherDisplay = (props: { mon: PKMInterface }) => {
  const { mon } = props
  const isDev = useIsDev()

  const heightCalculated = getWeightCalculated(mon)
  const weightCalculated = getWeightCalculated(mon)

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
            <code>{u32Display(mon.personalityValue)}</code>
          </AttributeRow>
        )}
        {mon.encryptionConstant !== undefined && (
          <AttributeRow label="Encryption Constant">
            <code>{u32Display(mon.encryptionConstant)}</code>
          </AttributeRow>
        )}
        {mon.encryptionConstant !== undefined && (
          <AttributeRow label="Shift Value">
            <code>{(mon.encryptionConstant & 0x3e000) >> (0xd % 24)}</code>
          </AttributeRow>
        )}
        <AttributeRowExpand
          summary="Original Trainer"
          value={
            <Flex gap="1">
              {mon.trainerName}
              <GenderIcon gender={genderFromBool(mon.trainerGender)} />
            </Flex>
          }
        >
          <AttributeRow label="ID" value={getDisplayID(mon as any)} indent={10} />
          {mon.secretID !== undefined && (
            <AttributeRow label="Secret ID" indent={10}>
              <code>{`${u16Display(mon.secretID)}`}</code>
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
            value={
              <Flex gap="1">
                {mon.handlerName}
                <GenderIcon
                  gender={
                    mon.handlerGender !== undefined ? genderFromBool(mon.handlerGender) : undefined
                  }
                />
              </Flex>
            }
          >
            {mon.handlerID !== undefined && mon.handlerID !== 0 && (
              <AttributeRow label="ID" value={mon.handlerID.toString()} indent={10} /> // unused in official games??
            )}
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
        {OriginGames.generation(mon.gameOfOrigin) === Generation.G4 &&
          mon.encounterType !== undefined && (
            <AttributeRow label="Gen 4 Encounter Type" value={EncounterTypes[mon.encounterType]} />
          )}
        {mon.shinyLeaves !== undefined &&
          !isRestricted(HGSS_TRANSFER_RESTRICTIONS, mon.dexNum, mon.formeNum) && (
            <AttributeRow label="Shiny Leaves">
              <ShinyLeavesDisplay leaves={mon.shinyLeaves} />
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
        {!isRestricted(SWSH_TRANSFER_RESTRICTIONS_CT, mon.dexNum, mon.formeNum) &&
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

        {!isRestricted(SV_TRANSFER_RESTRICTIONS_ID, mon.dexNum, mon.formeNum) &&
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

        {(!isRestricted(SWSH_TRANSFER_RESTRICTIONS_CT, mon.dexNum, mon.formeNum) ||
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
        {(!isRestricted(SWSH_TRANSFER_RESTRICTIONS_CT, mon.dexNum, mon.formeNum) ||
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
        {!isRestricted(SWSH_TRANSFER_RESTRICTIONS_CT, mon.dexNum, mon.formeNum) &&
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
        {!isRestricted(SV_TRANSFER_RESTRICTIONS_ID, mon.dexNum, mon.formeNum) &&
          hasTeraTypes(mon) && <TeraTypeData mon={mon} />}
        {!isRestricted(SV_TRANSFER_RESTRICTIONS_ID, mon.dexNum, mon.formeNum) &&
          mon.obedienceLevel !== undefined && (
            <AttributeRow label="Obedience" value={mon.obedienceLevel.toString()} />
          )}
        {mon.heightScalar !== undefined && mon.weightScalar !== undefined && (
          <>
            <AttributeRow label="Height (Relative)" value={`${mon.heightScalar} / 255`} />
            <AttributeRow label="Weight (Relative)" value={`${mon.weightScalar} / 255`} />
          </>
        )}
        {mon.scale !== undefined && <AttributeRow label="Scale" value={mon.scale} />}
        {mon.heightAbsolute !== undefined && mon.weightAbsolute !== undefined && (
          <>
            <AttributeRow
              label="Height (Absolute)"
              value={`${Math.floor((mon.heightAbsolute * CM_TO_IN) / 12)}'${Math.round((mon.heightAbsolute * CM_TO_IN) % 12)}" • ${mon.heightAbsolute.toPrecision(5)} cm`}
            />
            {isDev && (
              <AttributeRow
                label="Height (Calculated)"
                value={`${Math.floor((heightCalculated * CM_TO_IN) / 12)}'${Math.round((heightCalculated * CM_TO_IN) % 12)}" • ${heightCalculated.toPrecision(5)} cm`}
              />
            )}
            <AttributeRow
              label="Weight (Absolute)"
              value={`${(mon.weightAbsolute * HG_TO_LB).toPrecision(5)} lb • ${(mon.weightAbsolute / 10).toPrecision(5)} kg`}
            />
            {isDev && (
              <AttributeRow
                label="Weight (Calculated)"
                value={`${(weightCalculated * HG_TO_LB).toPrecision(5)} lb • ${(weightCalculated / 10).toPrecision(5)} kg`}
              />
            )}
          </>
        )}
        {!isRestricted(GEN2_TRANSFER_RESTRICTIONS, mon.dexNum, mon.formeNum) &&
          mon.dvs !== undefined && (
            <AttributeRow
              label="Gen 1/2 ID"
              value={getMonGen12Identifier(mon as PKMInterface & { dvs: StatsPreSplit })}
            />
          )}
        {!isRestricted(HGSS_TRANSFER_RESTRICTIONS, mon.dexNum, mon.formeNum) &&
          (mon instanceof PK3 ||
            mon instanceof PK4 ||
            mon instanceof PK5 ||
            mon instanceof OHPKM) &&
          mon.personalityValue !== undefined && (
            <AttributeRow label="Gen 3/4/5 ID" value={getMonGen345Identifier(mon)} />
          )}
        {mon.formArgument !== undefined && (
          <AttributeRow label="Form Argument" value={mon.formArgument.toString()} />
        )}
        {mon.checksum !== undefined && mon.calcChecksum && (
          <>
            <AttributeRow label="Checksum">
              <code>{u16Display(mon.checksum)}</code>
            </AttributeRow>
            {'calcChecksum' in mon && (
              <AttributeRow label="Calced Checksum">
                <code>{u16Display(mon.calcChecksum())}</code>
              </AttributeRow>
            )}
          </>
        )}
        {mon instanceof OHPKM && (
          <AttributeRow label="OpenHome ID" value={getMonFileIdentifier(mon)} />
        )}
        {mon.relearnMoves && (
          <>
            {mon.relearnMoves[0] > 0 && (
              <AttributeRow label="Relearn Move 1" value={Moves[mon.relearnMoves[0]]?.name} />
            )}
            {mon.relearnMoves[1] > 0 && (
              <AttributeRow label="Relearn Move 2" value={Moves[mon.relearnMoves[1]]?.name} />
            )}
            {mon.relearnMoves[2] > 0 && (
              <AttributeRow label="Relearn Move 3" value={Moves[mon.relearnMoves[2]]?.name} />
            )}
            {mon.relearnMoves[3] > 0 && (
              <AttributeRow label="Relearn Move 4" value={Moves[mon.relearnMoves[3]]?.name} />
            )}
          </>
        )}
        {mon.eggDate && <AttributeRow label="Hatch Date" value={mon.eggDate} />}
        <AttributeRow label="Egg Location Index" value={mon.eggLocationIndex} />
        <AttributeRow label="Gender" value={mon.gender} />
        <AttributeRow label="Is Egg" value={String(Boolean(mon.isEgg))} />
        <AttributeRow label="Is Nicknamed" value={String(Boolean(mon.isNicknamed))} />
        <AttributeRow label="Is Favorite" value={String(Boolean(mon.favorite))} />
        <AttributeRow label="Is Shadow" value={String(Boolean(mon.isShadow))} />
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

function u16Display(val: number) {
  return `${hexStr(val, 4)} (${val})`
}

function u32Display(val: number) {
  return `${hexStr(val, 8)} (${val})`
}

function hexStr(val: number, digits: number) {
  return '0x' + changeEndianness(val.toString(16).toUpperCase().padStart(digits, '0'))
}

const changeEndianness = (hex: string) => {
  const result = []
  let len = hex.length - 2

  while (len >= 0) {
    result.push(hex.substr(len, 2))
    len -= 2
  }
  return result.join('')
}
