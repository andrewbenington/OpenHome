mod emerald_expansion;

// include/constants/pokeball.h - enum PokeBall
pub const EMERALD_EX_BALLS: [Ball; 28] = [
    Ball::Strange,
    Ball::Poke,
    Ball::Great,
    Ball::Ultra,
    Ball::Master,
    Ball::Premier,
    Ball::Heal,
    Ball::Net,
    Ball::Nest,
    Ball::Dive,
    Ball::Dusk,
    Ball::Timer,
    Ball::Quick,
    Ball::Repeat,
    Ball::Luxury,
    Ball::Level,
    Ball::Lure,
    Ball::Moon,
    Ball::Friend,
    Ball::Love,
    Ball::Fast,
    Ball::Heavy,
    Ball::Dream,
    Ball::Safari,
    Ball::Sport,
    Ball::Park,
    Ball::Beast,
    Ball::Cherish,
];

#[inline]
fn emerald_ex_ball_from_index(idx: u8) -> Ball {
    EMERALD_EX_BALLS.get(idx as usize).copied().unwrap_or(Ball::Strange)
}

#[inline]
fn emerald_ex_ball_index(ball: Ball) -> u8 {
    if let Some(i) = EMERALD_EX_BALLS.iter().position(|&b| b == ball) {
        i as u8
    } else {
        // fallback to Strange on unknown
        EMERALD_EX_BALLS.iter().position(|&b| b == Ball::Strange).unwrap() as u8
    }
}