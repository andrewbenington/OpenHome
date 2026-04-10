import { NationalDex } from '@pokemon-resources/consts/NationalDex';
import { Moves } from '@pokemon-resources/index';
import Prando from 'prando';
import { Generation, MetadataLookup, NatureIndex, OriginGame, OriginGames, } from '@pkm-rs/pkg';
export function getGen3MiscFlags(pokemon) {
    if ('isEgg' in pokemon && pokemon.isEgg) {
        return 0b0110;
    }
    return 0b0010;
}
export function getDisplayID(pokemon) {
    if (!('gameOfOrigin' in pokemon) ||
        OriginGames.generation(pokemon.gameOfOrigin) === Generation.G1 ||
        OriginGames.generation(pokemon.gameOfOrigin) === Generation.G2 ||
        pokemon.gameOfOrigin < OriginGame.Sun) {
        return pokemon.trainerID.toString().padStart(5, '0');
    }
    const fullTrainerID = (BigInt(pokemon.secretID) << BigInt(16)) | BigInt(pokemon.trainerID);
    return (fullTrainerID % BigInt(1000000)).toString().padStart(6, '0');
}
const getIsShinyPreGen6 = (trainerID, secretID, personalityValue) => (trainerID ^ secretID ^ ((personalityValue >> 16) & 0xffff) ^ (personalityValue & 0xffff)) < 8;
export const getUnownLetterGen3 = (personalityValue) => {
    let letterValue = (personalityValue >> 24) & 0x3;
    letterValue = ((personalityValue >> 16) & 0x3) | (letterValue << 2);
    letterValue = ((personalityValue >> 8) & 0x3) | (letterValue << 2);
    letterValue = (personalityValue & 0x3) | (letterValue << 2);
    return letterValue % 28;
};
export function generatePersonalityValuePreservingAttributes(mon) {
    const prng = new Prando(mon.personalityValue ?? mon.dvs?.atk);
    let personalityValue = 0;
    let otherNature;
    if (mon.personalityValue !== undefined && mon.abilityNum !== undefined) {
        personalityValue = mon.personalityValue;
        otherNature = mon.nature;
    }
    else {
        personalityValue = prng.nextInt(0, 0xffffffff);
    }
    if ('statNature' in mon) {
        otherNature = mon.statNature;
    }
    // xoring the other three values with this to calculate upper half of personality value
    // will ensure shininess or non-shininess depending on original mon
    let newPersonalityValue = BigInt(personalityValue);
    const metadata = MetadataLookup(mon.dexNum, 0);
    if (!metadata) {
        return Number(newPersonalityValue);
    }
    const otherGender = mon.gender ?? metadata.genderFromPid(Number(newPersonalityValue));
    const shouldCheckUnown = mon.dexNum === NationalDex.Unown;
    let i = 0;
    while (i < 0x10000) {
        const newGender = metadata.genderFromPid(Number(newPersonalityValue));
        const newNature = NatureIndex.newFromPid(Number(newPersonalityValue));
        function getInconsistancy() {
            if (shouldCheckUnown && getUnownLetterGen3(Number(newPersonalityValue)) !== mon.formeNum) {
                return 'wrong unown letter';
            }
            else if (newGender !== otherGender) {
                return `gender mismatch`;
            }
            else if (otherNature !== undefined && !newNature.equals(otherNature)) {
                return 'nature mismatch';
            }
            else if (getIsShinyPreGen6(mon.trainerID, mon.secretID ?? 0, Number(newPersonalityValue)) !==
                mon.isShiny()) {
                return 'shininess mismatch';
            }
            return null;
        }
        if (getInconsistancy() === null) {
            return Number(newPersonalityValue);
        }
        i++;
        const pvBytes = new DataView(new Uint8Array(4).buffer);
        pvBytes.setInt32(0, personalityValue, true);
        let pvLower16, pvUpper16;
        if (mon.dexNum === NationalDex.Unown) {
            pvLower16 = prng.nextInt(0, 0xffff);
            pvUpper16 = prng.nextInt(0, 0xffff);
            if (mon.isShiny()) {
                pvUpper16 =
                    ((mon.trainerID ^ (mon.secretID ?? 0) ^ pvLower16) & 0xfcfc) | (pvUpper16 & 0x0303);
            }
        }
        else {
            pvLower16 = pvBytes.getUint16(0, true);
            pvUpper16 = pvBytes.getUint16(2, true);
            pvLower16 ^= i;
            if (mon.isShiny()) {
                pvUpper16 = mon.trainerID ^ (mon.secretID ?? 0) ^ pvLower16;
            }
        }
        pvBytes.setUint16(2, pvUpper16, true);
        pvBytes.setUint16(0, pvLower16, true);
        newPersonalityValue = BigInt(pvBytes.getUint32(0, true));
    }
    return personalityValue;
}
export const getMoveMaxPP = (moveIndex, format, ppUps = 0) => {
    const move = Moves[moveIndex];
    if (!move)
        return undefined;
    let baseMaxPP;
    switch (format) {
        case 'PK1':
            baseMaxPP = move.pastGenPP?.G1 ?? move.pp;
            break;
        case 'PK2':
            baseMaxPP = move.pastGenPP?.G2 ?? move.pp;
            break;
        case 'PK3':
        case 'COLOPKM':
        case 'XDPKM':
            baseMaxPP = move.pastGenPP?.G3 ?? move.pp;
            break;
        case 'PK4':
            baseMaxPP = move.pastGenPP?.G4 ?? move.pp;
            break;
        case 'PK5':
            baseMaxPP = move.pastGenPP?.G5 ?? move.pp;
            break;
        case 'PK6':
            baseMaxPP = move.pastGenPP?.G6 ?? move.pp;
            break;
        case 'PK7':
            baseMaxPP = move.pastGenPP?.SMUSUM ?? move.pp;
            break;
        case 'PB7':
            baseMaxPP = move.pastGenPP?.LGPE ?? move.pp;
            break;
        case 'PK8':
        case 'PB8':
            baseMaxPP = move.pastGenPP?.G8 ?? move.pp;
            break;
        case 'PA8':
            baseMaxPP = move.pastGenPP?.LA ?? move.pp;
            break;
        case 'PK9':
            baseMaxPP = move.pp;
            break;
        default:
            baseMaxPP = move.pp;
            break;
    }
    if (baseMaxPP === 1) {
        return baseMaxPP;
    }
    // gameboy games add less pp for 40pp moves
    if ((format === 'PK1' || format === 'PK2') && baseMaxPP === 40) {
        return baseMaxPP + Math.floor(ppUps * 7);
    }
    return baseMaxPP + Math.floor(ppUps * (baseMaxPP / 5));
};
export function adjustPpForFormat(sourceFormat, moves, currentPp, ppUps, destFormat) {
    return moves.map((move, i) => {
        const otherMaxPP = getMoveMaxPP(move, sourceFormat, ppUps[i]) ?? 0;
        const thisMaxPP = getMoveMaxPP(move, destFormat, ppUps[i]) ?? 0;
        const adjustedMovePP = currentPp[i] - (otherMaxPP - thisMaxPP);
        return adjustedMovePP > 0 ? adjustedMovePP : 0;
    });
}
export class MoveFilter {
    filter;
    constructor(filter) {
        this.filter = filter;
    }
    static fromMoveIndices(filter) {
        return new MoveFilter(filter);
    }
    static fromPkmClass(filter) {
        return new MoveFilter(filter);
    }
    moveIsAllowed(moveIndex) {
        return Array.isArray(this.filter)
            ? this.filter.includes(moveIndex)
            : moveIndex <= this.filter.maxValidMove();
    }
    filterByMoves(mon, values) {
        return mon.moves.map((moveIndex, i) => this.moveIsAllowed(moveIndex) ? values[i] : 0);
    }
    moves(mon) {
        return this.filterByMoves(mon, mon.moves);
    }
    movePp(mon, adjustForFormat) {
        const filteredMovePp = this.filterByMoves(mon, mon.movePP);
        return adjustPpForFormat(mon.format, mon.moves, filteredMovePp, mon.movePPUps, adjustForFormat);
    }
    movePpUps(mon) {
        return this.filterByMoves(mon, mon.movePPUps);
    }
    relearnMovesOrDefault(mon) {
        return (mon.relearnMoves?.map((moveIndex) => this.moveIsAllowed(moveIndex) ? moveIndex : 0) ?? [0, 0, 0, 0]);
    }
}
export function getHeightCalculated(mon) {
    const formeMetadata = MetadataLookup(mon.dexNum, mon.formeNum);
    if (!formeMetadata || mon.heightScalar === undefined || !mon.heightDeviation)
        return 0;
    const deviation = (mon.heightScalar / 255) * 0.40000004 + (1 - mon.heightDeviation);
    return formeMetadata.baseHeight * 100 * deviation;
}
export function getWeightCalculated(mon) {
    const formeMetadata = MetadataLookup(mon.dexNum, mon.formeNum);
    if (!formeMetadata || mon.weightScalar === undefined || !mon.weightDeviation)
        return 0;
    const deviation = (mon.weightScalar / 255) * 0.40000004 + (1 - mon.weightDeviation);
    return formeMetadata.baseWeight * 10 * deviation;
}
