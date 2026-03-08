/**
 * Move mapping for Luminescent Platinum.
 * Data derived from:
 * https://github.com/TalonSabre/PKLumiHex
 * (see MoveInfo8bLumi.cs).
 */

// Highest supported move index in Luminescent Platinum (Gen 9 up to ID 919)
export const LUMI_MAX_MOVE_ID = 919

// Moves intentionally excluded by Luminescent Platinum (Z-Moves and Max Moves)
// Stored in a Set for constant-time lookup when validating moves
export const UNUSED_IN_LUMI = new Set([
  // Z-Moves
  622, 623, 624, 625, 626, 627, 628, 629, 630, 631, 632, 633, 634, 635, 636, 637, 638, 639, 640,
  641, 642, 643, 644, 645, 646, 647, 648, 649, 650, 651, 652, 653, 654, 655, 656, 657, 658, 671,
  719,

  // Max Moves
  757, 758, 759, 760, 761, 762, 763, 764, 765, 766, 767, 768, 769, 770, 771, 772, 773, 774,
])

// Precompute the list of valid moves used by OpenHome dropdowns
// Includes all supported moves except those excluded above
export const VALID_MOVE_INDICES_LUMI: number[] = []
for (let i = 1; i <= LUMI_MAX_MOVE_ID; i++) {
  if (!UNUSED_IN_LUMI.has(i)) {
    VALID_MOVE_INDICES_LUMI.push(i)
  }
}

/**
 * Converts a move index from a Luminescent Platinum save
 * into the National Move ID used internally by OpenHome.
 */
export function fromLumiMoveIndex(gameIndex: number): number {
  if (gameIndex === 0 || gameIndex > LUMI_MAX_MOVE_ID || UNUSED_IN_LUMI.has(gameIndex)) {
    return 0 // None / empty move slot
  }

  // Move IDs match the National Move index directly
  return gameIndex
}

/**
 * Converts a National Move ID back into the Luminescent Platinum
 * move index used in the save file.
 */
export function toLumiMoveIndex(nationalMoveId: number): number {
  if (
    nationalMoveId === 0 ||
    nationalMoveId > LUMI_MAX_MOVE_ID ||
    UNUSED_IN_LUMI.has(nationalMoveId)
  ) {
    return 0
  }

  // Move IDs match the National Move index directly
  return nationalMoveId
}
