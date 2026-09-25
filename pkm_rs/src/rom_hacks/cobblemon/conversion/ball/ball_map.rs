use bimap::BiHashMap;
use pkm_rs_resources::ball::Ball;
use serde::Serialize;
use std::sync::LazyLock;

#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;
#[cfg(feature = "randomize")]
use rand::RngExt;

// Cobblemon has some unique Poke Balls that need to be tracked

static COBBLEMON_BALL_MAP: LazyLock<BiHashMap<&str, CobblemonBall>> = LazyLock::new(|| {
    BiHashMap::from_iter([
        ("cobblemon:poke_ball", CobblemonBall::Poke),
        ("cobblemon:slate_ball", CobblemonBall::Slate),
        ("cobblemon:azure_ball", CobblemonBall::Azure),
        ("cobblemon:verdant_ball", CobblemonBall::Verdant),
        ("cobblemon:roseate_ball", CobblemonBall::Roseate),
        ("cobblemon:citrine_ball", CobblemonBall::Citrine),
        ("cobblemon:great_ball", CobblemonBall::Great),
        ("cobblemon:ultra_ball", CobblemonBall::Ultra),
        ("cobblemon:master_ball", CobblemonBall::Master),
        ("cobblemon:safari_ball", CobblemonBall::Safari),
        ("cobblemon:fast_ball", CobblemonBall::Fast),
        ("cobblemon:level_ball", CobblemonBall::Level),
        ("cobblemon:lure_ball", CobblemonBall::Lure),
        ("cobblemon:heavy_ball", CobblemonBall::Heavy),
        ("cobblemon:love_ball", CobblemonBall::Love),
        ("cobblemon:friend_ball", CobblemonBall::Friend),
        ("cobblemon:moon_ball", CobblemonBall::Moon),
        ("cobblemon:sport_ball", CobblemonBall::Sport),
        ("cobblemon:net_ball", CobblemonBall::Net),
        ("cobblemon:dive_ball", CobblemonBall::Dive),
        ("cobblemon:nest_ball", CobblemonBall::Nest),
        ("cobblemon:repeat_ball", CobblemonBall::Repeat),
        ("cobblemon:timer_ball", CobblemonBall::Timer),
        ("cobblemon:luxury_ball", CobblemonBall::Luxury),
        ("cobblemon:premier_ball", CobblemonBall::Premier),
        ("cobblemon:dusk_ball", CobblemonBall::Dusk),
        ("cobblemon:heal_ball", CobblemonBall::Heal),
        ("cobblemon:quick_ball", CobblemonBall::Quick),
        ("cobblemon:cherish_ball", CobblemonBall::Cherish),
        ("cobblemon:park_ball", CobblemonBall::Park),
        ("cobblemon:dream_ball", CobblemonBall::Dream),
        ("cobblemon:beast_ball", CobblemonBall::Beast),
        (
            "cobblemon:ancient_poke_ball",
            CobblemonBall::PokeLegendsArceus,
        ),
        (
            "cobblemon:ancient_citrine_ball",
            CobblemonBall::CitrineLegendsArceus,
        ),
        (
            "cobblemon:ancient_verdant_ball",
            CobblemonBall::VerdantLegendsArceus,
        ),
        (
            "cobblemon:ancient_azure_ball",
            CobblemonBall::AzureLegendsArceus,
        ),
        (
            "cobblemon:ancient_roseate_ball",
            CobblemonBall::RoseateLegendsArceus,
        ),
        (
            "cobblemon:ancient_slate_ball",
            CobblemonBall::SlateLegendsArceus,
        ),
        (
            "cobblemon:ancient_ivory_ball",
            CobblemonBall::IvoryLegendsArceus,
        ),
        (
            "cobblemon:ancient_great_ball",
            CobblemonBall::GreatLegendsArceus,
        ),
        (
            "cobblemon:ancient_ultra_ball",
            CobblemonBall::UltraLegendsArceus,
        ),
        (
            "cobblemon:ancient_heavy_ball",
            CobblemonBall::HeavyLegendsArceus,
        ),
        ("cobblemon:ancient_leaden_ball", CobblemonBall::Leaden),
        ("cobblemon:ancient_gigaton_ball", CobblemonBall::Gigaton),
        ("cobblemon:ancient_feather_ball", CobblemonBall::Feather),
        ("cobblemon:ancient_wing_ball", CobblemonBall::Wing),
        ("cobblemon:ancient_jet_ball", CobblemonBall::Jet),
        ("cobblemon:ancient_origin_ball", CobblemonBall::Origin),
    ])
});

static COBBLEMON_BALL_TO_OPENHOME_BALL_MAP: LazyLock<BiHashMap<CobblemonBall, Ball>> =
    LazyLock::new(|| {
        BiHashMap::from_iter([
            (CobblemonBall::Master, Ball::Master),
            (CobblemonBall::Ultra, Ball::Ultra),
            (CobblemonBall::Great, Ball::Great),
            (CobblemonBall::Poke, Ball::Poke),
            (CobblemonBall::Slate, Ball::Poke),
            (CobblemonBall::Azure, Ball::Poke),
            (CobblemonBall::Verdant, Ball::Poke),
            (CobblemonBall::Roseate, Ball::Poke),
            (CobblemonBall::Citrine, Ball::Poke),
            (CobblemonBall::Safari, Ball::Safari),
            (CobblemonBall::Net, Ball::Net),
            (CobblemonBall::Dive, Ball::Dive),
            (CobblemonBall::Nest, Ball::Nest),
            (CobblemonBall::Repeat, Ball::Repeat),
            (CobblemonBall::Timer, Ball::Timer),
            (CobblemonBall::Luxury, Ball::Luxury),
            (CobblemonBall::Premier, Ball::Premier),
            (CobblemonBall::Dusk, Ball::Dusk),
            (CobblemonBall::Heal, Ball::Heal),
            (CobblemonBall::Quick, Ball::Quick),
            (CobblemonBall::Cherish, Ball::Cherish),
            (CobblemonBall::Park, Ball::Strange),
            (CobblemonBall::Fast, Ball::Fast),
            (CobblemonBall::Level, Ball::Level),
            (CobblemonBall::Lure, Ball::Lure),
            (CobblemonBall::Heavy, Ball::Heavy),
            (CobblemonBall::Love, Ball::Love),
            (CobblemonBall::Friend, Ball::Friend),
            (CobblemonBall::Moon, Ball::Moon),
            (CobblemonBall::Sport, Ball::Sport),
            (CobblemonBall::Dream, Ball::Dream),
            (CobblemonBall::Beast, Ball::Beast),
            (CobblemonBall::PokeLegendsArceus, Ball::PokeLegendsArceus),
            (CobblemonBall::SlateLegendsArceus, Ball::PokeLegendsArceus),
            (CobblemonBall::AzureLegendsArceus, Ball::PokeLegendsArceus),
            (CobblemonBall::VerdantLegendsArceus, Ball::PokeLegendsArceus),
            (CobblemonBall::RoseateLegendsArceus, Ball::PokeLegendsArceus),
            (CobblemonBall::CitrineLegendsArceus, Ball::PokeLegendsArceus),
            (CobblemonBall::IvoryLegendsArceus, Ball::PokeLegendsArceus),
            (CobblemonBall::GreatLegendsArceus, Ball::GreatLegendsArceus),
            (CobblemonBall::UltraLegendsArceus, Ball::UltraLegendsArceus),
            (CobblemonBall::Feather, Ball::Feather),
            (CobblemonBall::Wing, Ball::Wing),
            (CobblemonBall::Jet, Ball::Jet),
            (CobblemonBall::HeavyLegendsArceus, Ball::HeavyLegendsArceus),
            (CobblemonBall::Leaden, Ball::Leaden),
            (CobblemonBall::Gigaton, Ball::Gigaton),
            (CobblemonBall::Origin, Ball::Origin),
        ])
    });

static COBBLEMON_BALL_NAME_MAP: LazyLock<BiHashMap<CobblemonBall, &str>> = LazyLock::new(|| {
    BiHashMap::from_iter([
        (CobblemonBall::Poke, Ball::Poke.name()),
        (CobblemonBall::Slate, "Slate"),
        (CobblemonBall::Azure, "Azure"),
        (CobblemonBall::Verdant, "Verdant"),
        (CobblemonBall::Roseate, "Roseate"),
        (CobblemonBall::Citrine, "Citrine"),
        (CobblemonBall::Great, Ball::Great.name()),
        (CobblemonBall::Ultra, Ball::Ultra.name()),
        (CobblemonBall::Master, Ball::Master.name()),
        (CobblemonBall::Safari, Ball::Safari.name()),
        (CobblemonBall::Fast, Ball::Fast.name()),
        (CobblemonBall::Level, Ball::Level.name()),
        (CobblemonBall::Lure, Ball::Lure.name()),
        (CobblemonBall::Heavy, Ball::Heavy.name()),
        (CobblemonBall::Love, Ball::Love.name()),
        (CobblemonBall::Friend, Ball::Friend.name()),
        (CobblemonBall::Moon, Ball::Moon.name()),
        (CobblemonBall::Sport, Ball::Sport.name()),
        (CobblemonBall::Net, Ball::Net.name()),
        (CobblemonBall::Dive, Ball::Dive.name()),
        (CobblemonBall::Nest, Ball::Nest.name()),
        (CobblemonBall::Repeat, Ball::Repeat.name()),
        (CobblemonBall::Timer, Ball::Timer.name()),
        (CobblemonBall::Luxury, Ball::Luxury.name()),
        (CobblemonBall::Premier, Ball::Premier.name()),
        (CobblemonBall::Dusk, Ball::Dusk.name()),
        (CobblemonBall::Heal, Ball::Heal.name()),
        (CobblemonBall::Quick, Ball::Quick.name()),
        (CobblemonBall::Cherish, Ball::Cherish.name()),
        (CobblemonBall::Park, "Park"),
        (CobblemonBall::Dream, Ball::Dream.name()),
        (CobblemonBall::Beast, Ball::Beast.name()),
        (CobblemonBall::PokeLegendsArceus, "Ancient Poké"),
        (CobblemonBall::CitrineLegendsArceus, "Ancient Citrine"),
        (CobblemonBall::VerdantLegendsArceus, "Ancient Verdant"),
        (CobblemonBall::AzureLegendsArceus, "Ancient Azure"),
        (CobblemonBall::RoseateLegendsArceus, "Ancient Roseate"),
        (CobblemonBall::SlateLegendsArceus, "Ancient Slate"),
        (CobblemonBall::IvoryLegendsArceus, "Ancient Ivory"),
        (CobblemonBall::GreatLegendsArceus, "Ancient Great"),
        (CobblemonBall::UltraLegendsArceus, "Ancient Ultra"),
        (CobblemonBall::HeavyLegendsArceus, "Ancient Heavy"),
        (CobblemonBall::Leaden, "Ancient Leaden"),
        (CobblemonBall::Gigaton, "Ancient Gigaton"),
        (CobblemonBall::Feather, "Ancient Feather"),
        (CobblemonBall::Wing, "Ancient Wing"),
        (CobblemonBall::Jet, "Ancient Jet"),
        (CobblemonBall::Origin, "Ancient Origin"),
    ])
});

static COBBLEMON_BALL_INDEX_MAP: LazyLock<BiHashMap<u8, CobblemonBall>> = LazyLock::new(|| {
    BiHashMap::from_iter([
        (1, CobblemonBall::Master),
        (2, CobblemonBall::Ultra),
        (3, CobblemonBall::Great),
        (4, CobblemonBall::Poke),
        (5, CobblemonBall::Slate),
        (6, CobblemonBall::Azure),
        (7, CobblemonBall::Verdant),
        (8, CobblemonBall::Roseate),
        (9, CobblemonBall::Citrine),
        (10, CobblemonBall::Safari),
        (11, CobblemonBall::Net),
        (12, CobblemonBall::Dive),
        (13, CobblemonBall::Nest),
        (14, CobblemonBall::Repeat),
        (15, CobblemonBall::Timer),
        (16, CobblemonBall::Luxury),
        (17, CobblemonBall::Premier),
        (18, CobblemonBall::Dusk),
        (19, CobblemonBall::Heal),
        (20, CobblemonBall::Quick),
        (21, CobblemonBall::Cherish),
        (22, CobblemonBall::Park),
        (23, CobblemonBall::Fast),
        (24, CobblemonBall::Level),
        (25, CobblemonBall::Lure),
        (26, CobblemonBall::Heavy),
        (27, CobblemonBall::Love),
        (28, CobblemonBall::Friend),
        (29, CobblemonBall::Moon),
        (30, CobblemonBall::Sport),
        (31, CobblemonBall::Dream),
        (32, CobblemonBall::Beast),
        (33, CobblemonBall::PokeLegendsArceus),
        (34, CobblemonBall::SlateLegendsArceus),
        (35, CobblemonBall::AzureLegendsArceus),
        (36, CobblemonBall::VerdantLegendsArceus),
        (37, CobblemonBall::RoseateLegendsArceus),
        (38, CobblemonBall::CitrineLegendsArceus),
        (39, CobblemonBall::IvoryLegendsArceus),
        (40, CobblemonBall::GreatLegendsArceus),
        (41, CobblemonBall::UltraLegendsArceus),
        (42, CobblemonBall::Feather),
        (43, CobblemonBall::Wing),
        (44, CobblemonBall::Jet),
        (45, CobblemonBall::HeavyLegendsArceus),
        (46, CobblemonBall::Leaden),
        (47, CobblemonBall::Gigaton),
        (48, CobblemonBall::Origin),
    ])
});

#[derive(Debug, Default, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
#[repr(u8)]
pub enum CobblemonBall {
    None,
    Master,
    Ultra,
    Great,
    #[default]
    Poke,
    Slate,
    Azure,
    Verdant,
    Roseate,
    Citrine,
    Safari,
    Net,
    Dive,
    Nest,
    Repeat,
    Timer,
    Luxury,
    Premier,
    Dusk,
    Heal,
    Quick,
    Cherish,
    Park,
    Fast,
    Level,
    Lure,
    Heavy,
    Love,
    Friend,
    Moon,
    Sport,
    Dream,
    Beast,
    //Strange,
    PokeLegendsArceus,
    SlateLegendsArceus,
    AzureLegendsArceus,
    VerdantLegendsArceus,
    RoseateLegendsArceus,
    CitrineLegendsArceus,
    IvoryLegendsArceus,
    GreatLegendsArceus,
    UltraLegendsArceus,
    Feather,
    Wing,
    Jet,
    HeavyLegendsArceus,
    Leaden,
    Gigaton,
    Origin,
}

pub const COBBLEMON_BALL_COUNT: usize = CobblemonBall::Origin as usize;

impl CobblemonBall {
    pub fn name(&self) -> &'static str {
        COBBLEMON_BALL_NAME_MAP
            .get_by_left(self)
            .copied()
            .expect("CobblemonBall is valid")
    }

    pub fn get_name_full(&self) -> String {
        format!("{} Ball", self.name())
    }
}

impl From<u8> for CobblemonBall {
    fn from(value: u8) -> Self {
        COBBLEMON_BALL_INDEX_MAP
            .get_by_left(&value)
            .copied()
            .expect("CobblemonBall index is valid")
    }
}

impl From<Ball> for CobblemonBall {
    fn from(ball: Ball) -> Self {
        COBBLEMON_BALL_TO_OPENHOME_BALL_MAP
            .get_by_right(&ball)
            .copied()
            .expect("Ball is valid")
    }
}

impl From<CobblemonBall> for Ball {
    fn from(ball: CobblemonBall) -> Self {
        COBBLEMON_BALL_TO_OPENHOME_BALL_MAP
            .get_by_left(&ball)
            .copied()
            .expect("Ball is valid")
    }
}

impl Serialize for CobblemonBall {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        self.name().serialize(serializer)
    }
}

#[cfg(feature = "randomize")]
impl Randomize for CobblemonBall {
    fn randomized<R: rand::Rng>(rng: &mut R) -> Self {
        CobblemonBall::from(rng.random_range(0..COBBLEMON_BALL_COUNT) as u8)
    }
}
