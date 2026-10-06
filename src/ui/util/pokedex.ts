import { displayIndexAdder, isBattleFormeItem } from '@openhome-core/pkm'
import { PKMInterface } from '@openhome-core/pkm/interfaces'
import { isPluginGame, PluginIdentifier, SAV } from '@openhome-core/save/interfaces'
import * as SpectaGenerated from '@openhome-core/tauri/spectaCommands'
import { OriginGameStr } from '@openhome-core/tauri/spectaCommands'
import { Option } from '@openhome-core/util/functional'
import {
  acquirableTotemBaseForm,
  Gender,
  isAcquirableTotemForm,
  OriginGame,
  OriginGames,
} from '@pkm-rs/pkg'

export type PokedexEntry = SpectaGenerated.PokedexEntry
export type PokedexLevel = SpectaGenerated.PokedexLevel
export type Pokedex = SpectaGenerated.Pokedex
export type PokedexUpdate = SpectaGenerated.PokedexUpdate

export function isOriginGameStr(v: string): v is OriginGameStr {
  return OriginGames.isOriginGameString(v)
}

export function parseOriginGame(v: string): Option<OriginGame> {
  return isOriginGameStr(v) ? OriginGame[v] : undefined
}

export function originToStr(v: OriginGame): OriginGameStr {
  return OriginGame[v] as OriginGameStr
}

export function pokedexUpdatesFromSave(saveFile: SAV) {
  const pokedexUpdates: PokedexUpdate[] = []

  for (const mon of saveFile.getAllMons()) {
    pokedexUpdates.push(...updatesFromMon(mon, saveFile.pluginIdentifier ?? saveFile.origin))
    const data = pokedexCaughtEntryFromMon(mon, saveFile.pluginIdentifier ?? saveFile.origin)
    pokedexUpdates.push({
      nationalDex: mon.nationalDex,
      formIndex: mon.formIndex,
      data,
    })

    if (isBattleFormeItem(mon.nationalDex, mon.heldItemIndex)) {
      pokedexUpdates.push({
        nationalDex: mon.nationalDex,
        formIndex: displayIndexAdder(mon.heldItemIndex)(mon.formIndex),
        data,
      })
    }
  }

  return pokedexUpdates
}

function pokedexCaughtEntryFromMon(
  mon: PKMInterface,
  game: Option<OriginGame | SpectaGenerated.PluginIdentifier>
): SpectaGenerated.FormEntry {
  const gameString = typeof game === 'number' ? OriginGame[game] : undefined
  const originGame = gameString && isOriginGameStr(gameString) ? gameString : undefined

  const usePluginGame = game && isPluginGame(game)

  return {
    level: mon.isShiny() ? 'ShinyCaught' : 'Caught',
    games: originGame && !usePluginGame ? [originGame] : [],
    extra: usePluginGame ? [game] : [],
    flags: pokedexFlagsFromMon(mon),
    shiny_leaves: mon.shinyLeaves?.toByte() ?? 0,
  }
}

function pokedexFlagsFromMon(mon: PKMInterface): SpectaGenerated.PokedexFlag[] {
  const flags: SpectaGenerated.PokedexFlag[] = []
  if (mon.gender === Gender.Male) {
    flags.push('Male')
  } else if (mon.gender === Gender.Female) {
    flags.push('Female')
  }

  if (mon.isNsPokemon) {
    flags.push('NsPokemon')
  }
  if (mon.canGigantamax) {
    flags.push('Gigantamax')
  }
  if (mon.isAlpha) {
    flags.push('Alpha')
  }
  if (mon.metadata?.formeName.toLowerCase().includes('totem')) {
    flags.push('Totem')
  }
  if (mon.ribbons?.includes('Titan Mark')) {
    flags.push('Titan')
  }

  return flags
}

export function updatesFromMon(
  mon: PKMInterface,
  game?: OriginGame | PluginIdentifier
): PokedexUpdate[] {
  const pokedexUpdates: PokedexUpdate[] = []
  pokedexUpdates.push({
    nationalDex: mon.nationalDex,
    formIndex: mon.formIndex,
    data: pokedexCaughtEntryFromMon(mon, game),
  })

  if (isBattleFormeItem(mon.nationalDex, mon.heldItemIndex)) {
    pokedexUpdates.push({
      nationalDex: mon.nationalDex,
      formIndex: displayIndexAdder(mon.heldItemIndex)(mon.formIndex),
      data: pokedexCaughtEntryFromMon(mon, game),
    })
  }

  // Totem forms have separate indexes, so the totem flag needs to be set for the form the
  // totem is based on.
  if (isAcquirableTotemForm(mon.nationalDex, mon.formIndex)) {
    const totemBaseForm = acquirableTotemBaseForm(mon.nationalDex)
    if (totemBaseForm) {
      pokedexUpdates.push({
        nationalDex: mon.nationalDex,
        formIndex: totemBaseForm.formIndex,
        data: { ...pokedexCaughtEntryFromMon(mon, game) },
      })
    }
  }

  return pokedexUpdates
}
