import { GameOfOrigin } from "../consts/GameOfOrigin";
import BDSPLocations from "./BDSP";
import BW2MetLocation from "./BW2";
import CXDLocation from "./CXD";
import G4Locations from "./G4";
import G6Location from "./G6";
import LALocation from "./LA";
import LGPELocations from "./LGPE";
import RSEFRLGLocations from "./RSEFRLG";
import SMUSUMLocations from "./SMUSUM";
import SVMetLocation from "./SV";
import SwShLocations from "./SwSh";

export const getMetLocation = (game: number, index: number, egg: boolean = false) => {
  let multiplier = 10000;
  let locations: { [key: number]: string[] } = {};
  if (game < 20 && index > 30000) {
    return `in the ${GameOfOrigin[game]?.region} region`;
  } else if (game <= 5) {
    locations = RSEFRLGLocations;
  } else if (game === 15) {
    locations = CXDLocation;
  } else if (game >= 7 && game <= 12) {
    multiplier = 1000;
    locations = G4Locations;
  } else if (game >= 20 && game <= 23) {
    locations = BW2MetLocation;
  } else if (game >= 24 && game <= 29) {
    locations = G6Location;
  } else if (game >= 30 && game <= 41) {
    locations = SMUSUMLocations;
  } else if (game >= 42 && game <= 43) {
    locations = LGPELocations;
  } else if (game >= 44 && game <= 45) {
    locations = SwShLocations;
  } else if (game === 47) {
    locations = LALocation;
  } else if (game >= 48 && game <= 49) {
    locations = BDSPLocations;
  } else if (game >= 50 && game <= 51) {
    locations = SVMetLocation;
  }
  let locationBlock = locations[Math.floor(index / multiplier) * multiplier];
  if (locationBlock) {
    if (game === 47) {
      return locationBlock[index % multiplier];
    } else if (egg) {
      return "from " + locationBlock[index % multiplier];
    } else {
      return "in " + locationBlock[index % multiplier];
    }
  }
  return index.toString();
};
