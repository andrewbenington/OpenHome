import {
  GameOfOrigin,
  GameOfOriginData,
  isAlola,
  isBDSP,
  isGalar,
  isGen4,
  isGen5,
  isGen6,
  isGen9,
  isLetsGo,
} from '../GameOfOrigin';
import BDSPLocations from './BDSP';
import CrystalLocation from './Crystal';
import CXDLocation from './CXD';
import G4Locations from './G4';
import G5Locations from './G5';
import G6Locations from './G6';
import LALocations from './LA';
import LGPELocations from './LGPE';
import RSEFRLGLocations from './RSEFRLG';
import SMUSUMLocations from './SMUSUM';
import SVMetLocation from './SV';
import SwShLocations from './SwSh';

export const getLocation = (
  game: number,
  index: number,
  format: string,
  egg: boolean = false
) => {
  let multiplier = 10000;
  let locations: { [key: number]: string[] } = {};
  if (game >= GameOfOrigin.Red && game <= GameOfOrigin.Crystal) {
    locations = CrystalLocation;
  } else if (format === 'PB7') {
    if (game < GameOfOrigin.LetsGoPikachu || game > GameOfOrigin.LetsGoEevee) {
      return game <= GameOfOrigin.UltraMoon
        ? `in the ${GameOfOriginData[game]?.region} region`
        : 'in a faraway place';
    }
    locations = LGPELocations;
  } else if (format === 'PK8') {
    if (game < GameOfOrigin.Sword || game > GameOfOrigin.ShiningPearl) {
      return game <= GameOfOrigin.LetsGoEevee
        ? `in the ${GameOfOriginData[game]?.region} region`
        : 'in a faraway place';
    }
    if (game >= GameOfOrigin.BrilliantDiamond) {
      locations = BDSPLocations;
    } else {
      locations = SwShLocations;
    }
  } else if (game <= GameOfOrigin.LeafGreen) {
    locations = RSEFRLGLocations;
  } else if (game === GameOfOrigin.ColosseumXD) {
    locations = CXDLocation;
  } else if (isGen4(game)) {
    multiplier = 1000;
    locations = G4Locations;
  } else if (isGen5(game)) {
    locations = G5Locations;
  } else if (isGen6(game)) {
    locations = G6Locations;
  } else if (isAlola(game)) {
    locations = SMUSUMLocations;
  } else if (isLetsGo(game)) {
    locations = LGPELocations;
  } else if (isGalar(game)) {
    locations = SwShLocations;
  } else if (game === GameOfOrigin.LegendsArceus) {
    locations = LALocations;
  } else if (isBDSP(game)) {
    locations = BDSPLocations;
  } else if (isGen9(game)) {
    locations = SVMetLocation;
  }
  const locationBlock = locations[Math.floor(index / multiplier) * multiplier];
  if (locationBlock) {
    if (game === GameOfOrigin.LegendsArceus) {
      return locationBlock[index % multiplier];
    }
    if (egg) {
      return `from ${locationBlock[index % multiplier]}`;
    }
    return `in ${locationBlock[index % multiplier]}`;
  }
  return index.toString();
};
