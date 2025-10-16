import {
    GameOfOrigin,
    GameOfOriginData,
    isAlola,
    isBDSP,
    isGalar,
    isGBA,
    isGen2,
    isGen4,
    isGen5,
    isGen6,
    isGen9,
    isLetsGo,
} from '../other/game-of-origin'

import { Gen2Locations } from './gen2'
import { Gen3GBALocations } from './gen3-gba'
import { Gen3GCNLocations } from './gen3-gcn'
import { Gen4Locations } from './gen4'
import { Gen5Locations } from './gen5'
import { Gen6Locations } from './gen6'
import { Gen7AlolaLocations } from './gen7-alola'
import { Gen7KantoLocations } from './gen7-kanto'
import { Gen8GalarLocations } from './gen8-galar'
import { Gen8HisuiLocations } from './gen8-hisui'
import { Gen8SinnohLocations } from './gen8-sinnoh'
import { Gen9Locations } from './gen9'

export const getLocationString = (game: number, index: number, format: string, egg = false) => {
    if (game <= GameOfOrigin.White && index === 30001) {
        return 'at the Poké Transfer Lab'
    }

    if (game === GameOfOrigin.GO) {
        return 'in Pokémon GO'
    }

    let multiplier = 10000
    let locations: { [key: number]: string[] } = {}

    if (game >= GameOfOrigin.Red && game <= GameOfOrigin.Crystal) {
        locations = Gen2Locations
    } else if (format === 'PB7') {
        if (game < GameOfOrigin.LetsGoPikachu || game > GameOfOrigin.LetsGoEevee) {
            return game <= GameOfOrigin.UltraMoon
                ? `in the ${GameOfOriginData[game]?.region} region`
                : 'in a faraway place'
        }
        locations = Gen7KantoLocations
    } else if (format === 'PK8') {
        if (game !== GameOfOrigin.Sword && game !== GameOfOrigin.Sword) {
            return game <= GameOfOrigin.LetsGoEevee
                ? `in the ${GameOfOriginData[game]?.region} region`
                : 'in a faraway place'
        }
        locations = Gen8GalarLocations
    } else if (format === 'PB8') {
        if (game !== GameOfOrigin.BrilliantDiamond && game !== GameOfOrigin.ShiningPearl) {
            return game <= GameOfOrigin.Shield
                ? `in the ${GameOfOriginData[game]?.region} region`
                : 'in a faraway place'
        }
        locations = Gen8SinnohLocations
    } else if (game <= GameOfOrigin.LeafGreen) {
        locations = Gen3GBALocations
    } else if (game === GameOfOrigin.ColosseumXD) {
        locations = Gen3GCNLocations
    } else if (isGen4(game)) {
        multiplier = 1000
        locations = Gen4Locations
    } else if (isGen5(game)) {
        locations = Gen5Locations
    } else if (isGen6(game)) {
        locations = Gen6Locations
    } else if (isAlola(game)) {
        locations = Gen7AlolaLocations
    } else if (isLetsGo(game)) {
        locations = Gen7KantoLocations
    } else if (isGalar(game)) {
        locations = Gen8GalarLocations
    } else if (game === GameOfOrigin.LegendsArceus) {
        locations = Gen8HisuiLocations
    } else if (isBDSP(game)) {
        locations = Gen8SinnohLocations
    } else if (isGen9(game)) {
        locations = Gen9Locations
    }
    const locationBlock = locations[Math.floor(index / multiplier) * multiplier]
    if (locationBlock) {
        if (game === GameOfOrigin.LegendsArceus) {
            return locationBlock[index % multiplier]
        }
        if (egg) {
            return `from ${locationBlock[index % multiplier]}`
        }
        const location = locationBlock[index % multiplier]
        if (location?.startsWith('Route')) {
            return `on ${location}`
        }
        return `in ${location}`
    }
    return index.toString()
}

export function getMetLocation(
    index: number,
    source: { origin?: GameOfOrigin; fileFormat?: string }
): string {
    const { origin, fileFormat } = source

    if ((origin && isGen2(origin)) || fileFormat === 'PK2') {
        return Gen2Locations[0][index]
    }

    if ((origin && isGBA(origin)) || fileFormat === 'PK3') {
        return Gen3GBALocations[0][index]
    }

    if (origin === GameOfOrigin.ColosseumXD || fileFormat === 'COLOPKM' || fileFormat === 'XDPKM') {
        return Gen3GCNLocations[0][index]
    }

    if ((origin && isGen4(origin)) || fileFormat === 'PK4') {
        return Gen4Locations[Math.floor(index / 1000) * 1000][index % 1000]
    }

    if ((origin && isGen5(origin)) || fileFormat === 'PK5') {
        return Gen5Locations[Math.floor(index / 10000) * 10000][index % 10000]
    }

    if ((origin && isGen6(origin)) || fileFormat === 'PK6') {
        return Gen6Locations[Math.floor(index / 10000) * 10000][index % 10000]
    }

    if ((origin && isAlola(origin)) || fileFormat === 'PK7') {
        return Gen7AlolaLocations[Math.floor(index / 10000) * 10000][index % 10000]
    }

    if ((origin && isLetsGo(origin)) || fileFormat === 'PB7') {
        return Gen7KantoLocations[Math.floor(index / 10000) * 10000][index % 10000]
    }

    if ((origin && isGalar(origin)) || fileFormat === 'PK8') {
        return Gen8GalarLocations[Math.floor(index / 10000) * 10000][index % 10000]
    }

    if ((origin && isBDSP(origin)) || fileFormat === 'PB8') {
        return Gen8SinnohLocations[Math.floor(index / 10000) * 10000][index % 10000]
    }

    if (origin === GameOfOrigin.LegendsArceus || fileFormat === 'PA8') {
        return Gen8HisuiLocations[Math.floor(index / 10000) * 10000][index % 10000]
    }

    if ((origin && isGen9(origin)) || fileFormat === 'PK9') {
        return Gen9Locations[Math.floor(index / 10000) * 10000][index % 10000]
    }
    return ''
}
