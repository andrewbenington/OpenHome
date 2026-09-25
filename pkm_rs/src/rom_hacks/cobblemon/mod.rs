mod conversion;
mod pkcblmn;

use conversion::ball::ball_map::CobblemonBall;

const BOX_ROWS: u8 = 5;
const BOX_COLS: u8 = 6;
const BOX_SLOTS: u8 = BOX_ROWS * BOX_COLS;
const BOX_NAME_LENGTH: usize = 19;
