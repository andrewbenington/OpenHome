import { GameOfOrigin, GameOfOriginData } from '../GameOfOrigin';
import BDSPLocations from './BDSP';
import BW2MetLocation from './BW2';
import CrystalLocation from './Crystal';
import CXDLocation from './CXD';
import G4Locations from './G4';
import G6Location from './G6';
import LALocation from './LA';
import LGPELocations from './LGPE';
import RSEFRLGLocations from './RSEFRLG';
import SMUSUMLocations from './SMUSUM';
import SVMetLocation from './SV';
import SwShLocations from './SwSh';

export const getLocation = (
  game: number,
  index: number,
  forceRegion: boolean = false,
  egg: boolean = false
) => {
  let multiplier = 10000;
  let locations: { [key: number]: string[] } = {};
  if (game >= GameOfOrigin.Red && game <= GameOfOrigin.Crystal) {
    locations = CrystalLocation;
  } else if (forceRegion || (game < GameOfOrigin.White && index > 30000)) {
    return `in the ${GameOfOriginData[game]?.region} region`;
  } else if (game <= GameOfOrigin.LeafGreen) {
    locations = RSEFRLGLocations;
  } else if (game === GameOfOrigin.ColosseumXD) {
    locations = CXDLocation;
  } else if (game >= GameOfOrigin.HeartGold && game <= GameOfOrigin.Platinum) {
    multiplier = 1000;
    locations = G4Locations;
  } else if (game >= GameOfOrigin.White && game <= GameOfOrigin.Black2) {
    locations = BW2MetLocation;
  } else if (game >= GameOfOrigin.X && game <= GameOfOrigin.OmegaRuby) {
    locations = G6Location;
  } else if (game >= GameOfOrigin.Sun && game <= GameOfOrigin.UltraMoon) {
    locations = SMUSUMLocations;
  } else if (
    game >= GameOfOrigin.LetsGoPikachu &&
    game <= GameOfOrigin.LetsGoEevee
  ) {
    locations = LGPELocations;
  } else if (game >= GameOfOrigin.Sword && game <= GameOfOrigin.Shield) {
    locations = SwShLocations;
  } else if (game === GameOfOrigin.LegendsArceus) {
    locations = LALocation;
  } else if (
    game >= GameOfOrigin.BrilliantDiamond &&
    game <= GameOfOrigin.ShiningPearl
  ) {
    locations = BDSPLocations;
  } else if (game >= GameOfOrigin.Scarlet && game <= GameOfOrigin.Violet) {
    locations = SVMetLocation;
  }
  let locationBlock = locations[Math.floor(index / multiplier) * multiplier];
  if (locationBlock) {
    if (game === 47) {
      return locationBlock[index % multiplier];
    } else if (egg) {
      return 'from ' + locationBlock[index % multiplier];
    } else {
      return 'in ' + locationBlock[index % multiplier];
    }
  }
  return index.toString();
};
