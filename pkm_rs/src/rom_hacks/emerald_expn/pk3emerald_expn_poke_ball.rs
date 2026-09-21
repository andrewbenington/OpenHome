mod emerald_expn;

// include/constants/pokeball.h - enum PokeBall
pub enum EmeraldExpnBall {
    Strange,
    Poke,
    Great,
    Ultra,
    Master,
    Premier,
    Heal,
    Net,
    Nest,
    Dive,
    Dusk,
    Timer,
    Quick,
    Repeat,
    Luxury,
    Level,
    Lure,
    Moon,
    Friend,
    Love,
    Fast,
    Heavy,
    Dream,
    Safari,
    Sport,
    Park,
    Beast,
    Cherish,
};

#[inline]
fn emerald_expn_ball_from_index(idx: u8) -> Ball {
    EMERALD_EXPN_BALLS
        .get(idx as usize)
        .copied()
        .unwrap_or(Ball::Strange)
}

#[inline]
fn emerald_expn_ball_index(ball: Ball) -> u8 {
    if let Some(i) = EMERALD_EXPN_BALLS.iter().position(|&b| b == ball) {
        i as u8
    } else {
        // fallback to Strange on unknown
        EMERALD_EXPN_BALLS
            .iter()
            .position(|&b| b == Ball::Strange)
            .unwrap() as u8
    }
}
