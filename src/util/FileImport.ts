import { colopkm } from "../pkm/colopkm";
import { pa8 } from "../pkm/pa8";
import { pb7 } from "../pkm/pb7";
import { pk2 } from "../pkm/pk2";
import { pk3 } from "../pkm/pk3";
import { pk4 } from "../pkm/pk4";
import { pk5 } from "../pkm/pk5";
import { pk6 } from "../pkm/pk6";
import { pk7 } from "../pkm/pk7";
import { pk8 } from "../pkm/pk8";
import { pk9 } from "../pkm/pk9";
import { pkm } from "../pkm/pkm";
import { xdpkm } from "../pkm/xdpkm";

export const acceptableExtensions = [
  ".pkm",
  ".pk2",
  ".colopkm",
  ".xdpkm",
  ".pk5",
  ".pk6",
  ".pk7",
  ".pb7",
  ".pk8",
  ".pa8",
  ".pb8",
  ".pk9",
]

export const bytesToPKM = (bytes: Uint8Array, extension: string): pkm => {
  if (bytes.length === 73) {
    return new pk2(bytes.slice(3, bytes.length));
  } else if (extension === "colopkm") {
    return new colopkm(bytes);
  } else if (extension === "xdpkm") {
    return new xdpkm(bytes);
  } else if (
    extension === "pk3" ||
    bytes.length === 100 ||
    bytes.length === 80
  ) {
    return new pk3(bytes);
  } else if (
    bytes[0x5f] < 20 &&
    (extension === "pk4" || bytes.length === 136 || bytes.length === 236)
  ) {
    return new pk4(bytes);
  } else if (
    extension === "pk5" ||
    bytes.length === 0xdc ||
    bytes.length === 0x88 ||
    bytes.length === 136
  ) {
    return new pk5(bytes);
  } else if (extension === "pk6") {
    return new pk6(bytes);
  } else if (extension === "pk7") {
    return new pk7(bytes);
  } else if (extension === "pb7") {
    return new pb7(bytes);
  } else if (extension === "pk8" || extension === "pb8") {
    return new pk8(bytes, extension === "pb8" ? "pb8" : "pk8");
  } else if (extension === "pa8") {
    return new pa8(bytes);
  } else {
    return new pk9(bytes);
  }
};
