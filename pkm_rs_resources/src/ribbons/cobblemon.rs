use crate::ribbons::ribbon_set::{Ribbon, RibbonSet};
use crate::ribbons::{ModernRibbon, ObsoleteRibbon, OpenHomeRibbon};
use bimap::BiHashMap;
use std::fmt::Display;
use std::sync::LazyLock;

// ribbon lists are maintained separately from OpenHomeRibbon because Cobblemon operates on a different release cycle from the official games, and we don't want to tie Cobblemon data to new official game releases.

// all ribbons and marks in the base Cobblemon mod
static COBBLEMON_BASE_MARK_MAP_MODERN: LazyLock<BiHashMap<&str, CobblemonRibbon>> =
    LazyLock::new(|| {
        BiHashMap::from_iter([
            (
                "cobblemon:ribbon_champion_kalos",
                CobblemonRibbon::KalosChampion,
            ),
            ("cobblemon:ribbon_champion", CobblemonRibbon::Gen3Champion),
            (
                "cobblemon:ribbon_champion_sinnoh",
                CobblemonRibbon::SinnohChampion,
            ),
            (
                "cobblemon:ribbon_best_friends",
                CobblemonRibbon::BestFriends,
            ),
            ("cobblemon:ribbon_training", CobblemonRibbon::Training),
            (
                "cobblemon:ribbon_battler_skillful",
                CobblemonRibbon::SkillfulBattler,
            ),
            (
                "cobblemon:ribbon_battler_expert",
                CobblemonRibbon::ExpertBattler,
            ),
            ("cobblemon:ribbon_effort", CobblemonRibbon::Effort),
            ("cobblemon:ribbon_day_alert", CobblemonRibbon::Alert),
            ("cobblemon:ribbon_day_shock", CobblemonRibbon::Shock),
            ("cobblemon:ribbon_day_downcast", CobblemonRibbon::Downcast),
            ("cobblemon:ribbon_day_careless", CobblemonRibbon::Careless),
            ("cobblemon:ribbon_day_relax", CobblemonRibbon::Relax),
            ("cobblemon:ribbon_day_snooze", CobblemonRibbon::Snooze),
            ("cobblemon:ribbon_day_smile", CobblemonRibbon::Smile),
            (
                "cobblemon:ribbon_syndicate_gorgeous",
                CobblemonRibbon::Gorgeous,
            ),
            ("cobblemon:ribbon_syndicate_royal", CobblemonRibbon::Royal),
            (
                "cobblemon:ribbon_syndicate_gorgeous_royal",
                CobblemonRibbon::GorgeousRoyal,
            ),
            ("cobblemon:ribbon_artist", CobblemonRibbon::Artist),
            ("cobblemon:ribbon_footprint", CobblemonRibbon::Footprint),
            ("cobblemon:ribbon_record", CobblemonRibbon::Record),
            ("cobblemon:ribbon_legend", CobblemonRibbon::Legend),
            ("cobblemon:ribbon_event_country", CobblemonRibbon::Country),
            ("cobblemon:ribbon_event_national", CobblemonRibbon::National),
            ("cobblemon:ribbon_event_earth", CobblemonRibbon::Earth),
            ("cobblemon:ribbon_event_world", CobblemonRibbon::World),
            ("cobblemon:ribbon_event_classic", CobblemonRibbon::Classic),
            ("cobblemon:ribbon_event_premier", CobblemonRibbon::Premier),
            ("cobblemon:ribbon_event", CobblemonRibbon::Event),
            ("cobblemon:ribbon_event_birthday", CobblemonRibbon::Birthday),
            ("cobblemon:ribbon_event_special", CobblemonRibbon::Special),
            ("cobblemon:ribbon_event_souvenir", CobblemonRibbon::Souvenir),
            ("cobblemon:ribbon_event_wishing", CobblemonRibbon::Wishing),
            (
                "cobblemon:ribbon_event_champion_battle",
                CobblemonRibbon::BattleChampion,
            ),
            (
                "cobblemon:ribbon_event_champion_regional",
                CobblemonRibbon::RegionalChampion,
            ),
            (
                "cobblemon:ribbon_event_champion_national",
                CobblemonRibbon::NationalChampion,
            ),
            (
                "cobblemon:ribbon_event_champion_world",
                CobblemonRibbon::WorldChampion,
            ),
            (
                "cobblemon:ribbon_memory_contest",
                CobblemonRibbon::ContestMemory,
            ),
            (
                "cobblemon:ribbon_memory_contest_gold",
                CobblemonRibbon::ContestMemory,
            ),
            (
                "cobblemon:ribbon_memory_battle",
                CobblemonRibbon::BattleMemory,
            ),
            (
                "cobblemon:ribbon_memory_battle_gold",
                CobblemonRibbon::BattleMemory,
            ),
            (
                "cobblemon:ribbon_champion_hoenn",
                CobblemonRibbon::HoennChampion,
            ),
            (
                "cobblemon:ribbon_contest_super_star",
                CobblemonRibbon::ContestStar,
            ),
            (
                "cobblemon:ribbon_contest_super_master_coolness",
                CobblemonRibbon::CoolnessMaster,
            ),
            (
                "cobblemon:ribbon_contest_super_master_beauty",
                CobblemonRibbon::BeautyMaster,
            ),
            (
                "cobblemon:ribbon_contest_super_master_cuteness",
                CobblemonRibbon::CutenessMaster,
            ),
            (
                "cobblemon:ribbon_contest_super_master_cleverness",
                CobblemonRibbon::ClevernessMaster,
            ),
            (
                "cobblemon:ribbon_contest_super_master_toughness",
                CobblemonRibbon::ToughnessMaster,
            ),
            (
                "cobblemon:ribbon_champion_alola",
                CobblemonRibbon::AlolaChampion,
            ),
            (
                "cobblemon:ribbon_battle_royal_champion",
                CobblemonRibbon::BattleRoyalChampion,
            ),
            (
                "cobblemon:ribbon_battle_tree_great",
                CobblemonRibbon::BattleTreeGreat,
            ),
            (
                "cobblemon:ribbon_battle_tree_master",
                CobblemonRibbon::BattleTreeMaster,
            ),
            (
                "cobblemon:ribbon_champion_galar",
                CobblemonRibbon::GalarChampion,
            ),
            (
                "cobblemon:ribbon_battle_tower_master",
                CobblemonRibbon::TowerMaster,
            ),
            ("cobblemon:ribbon_master_rank", CobblemonRibbon::MasterRank),
            (
                "cobblemon:mark_time_lunchtime",
                CobblemonRibbon::LunchtimeMark,
            ),
            (
                "cobblemon:mark_time_sleepy-time",
                CobblemonRibbon::SleepyTimeMark,
            ),
            ("cobblemon:mark_time_dusk", CobblemonRibbon::DuskMark),
            ("cobblemon:mark_time_dawn", CobblemonRibbon::DawnMark),
            ("cobblemon:mark_weather_cloudy", CobblemonRibbon::CloudyMark),
            ("cobblemon:mark_weather_rainy", CobblemonRibbon::RainyMark),
            ("cobblemon:mark_weather_stormy", CobblemonRibbon::StormyMark),
            ("cobblemon:mark_weather_snowy", CobblemonRibbon::SnowyMark),
            (
                "cobblemon:mark_weather_blizzard",
                CobblemonRibbon::BlizzardMark,
            ),
            ("cobblemon:mark_weather_dry", CobblemonRibbon::DryMark),
            (
                "cobblemon:mark_weather_sandstorm",
                CobblemonRibbon::SandstormMark,
            ),
            ("cobblemon:mark_weather_misty", CobblemonRibbon::MistyMark),
            ("cobblemon:mark_destiny", CobblemonRibbon::DestinyMark),
            ("cobblemon:mark_fishing", CobblemonRibbon::FishingMark),
            ("cobblemon:mark_curry", CobblemonRibbon::CurryMark),
            ("cobblemon:mark_uncommon", CobblemonRibbon::UncommonMark),
            ("cobblemon:mark_rare", CobblemonRibbon::RareMark),
            (
                "cobblemon:mark_personality_rowdy",
                CobblemonRibbon::RowdyMark,
            ),
            (
                "cobblemon:mark_personality_absent-minded",
                CobblemonRibbon::AbsentMindedMark,
            ),
            (
                "cobblemon:mark_personality_jittery",
                CobblemonRibbon::JitteryMark,
            ),
            (
                "cobblemon:mark_personality_excited",
                CobblemonRibbon::ExcitedMark,
            ),
            (
                "cobblemon:mark_personality_charismatic",
                CobblemonRibbon::CharismaticMark,
            ),
            (
                "cobblemon:mark_personality_calmness",
                CobblemonRibbon::CalmnessMark,
            ),
            (
                "cobblemon:mark_personality_intense",
                CobblemonRibbon::IntenseMark,
            ),
            (
                "cobblemon:mark_personality_zoned-out",
                CobblemonRibbon::ZonedOutMark,
            ),
            (
                "cobblemon:mark_personality_joyful",
                CobblemonRibbon::JoyfulMark,
            ),
            (
                "cobblemon:mark_personality_angry",
                CobblemonRibbon::AngryMark,
            ),
            (
                "cobblemon:mark_personality_smiley",
                CobblemonRibbon::SmileyMark,
            ),
            (
                "cobblemon:mark_personality_teary",
                CobblemonRibbon::TearyMark,
            ),
            (
                "cobblemon:mark_personality_upbeat",
                CobblemonRibbon::UpbeatMark,
            ),
            (
                "cobblemon:mark_personality_peeved",
                CobblemonRibbon::PeevedMark,
            ),
            (
                "cobblemon:mark_personality_intellectual",
                CobblemonRibbon::IntellectualMark,
            ),
            (
                "cobblemon:mark_personality_ferocious",
                CobblemonRibbon::FerociousMark,
            ),
            (
                "cobblemon:mark_personality_crafty",
                CobblemonRibbon::CraftyMark,
            ),
            (
                "cobblemon:mark_personality_scowling",
                CobblemonRibbon::ScowlingMark,
            ),
            (
                "cobblemon:mark_personality_kindly",
                CobblemonRibbon::KindlyMark,
            ),
            (
                "cobblemon:mark_personality_flustered",
                CobblemonRibbon::FlusteredMark,
            ),
            (
                "cobblemon:mark_personality_pumped-up",
                CobblemonRibbon::PumpedUpMark,
            ),
            (
                "cobblemon:mark_personality_zero_energy",
                CobblemonRibbon::ZeroEnergyMark,
            ),
            (
                "cobblemon:mark_personality_prideful",
                CobblemonRibbon::PridefulMark,
            ),
            (
                "cobblemon:mark_personality_unsure",
                CobblemonRibbon::UnsureMark,
            ),
            (
                "cobblemon:mark_personality_humble",
                CobblemonRibbon::HumbleMark,
            ),
            (
                "cobblemon:mark_personality_thorny",
                CobblemonRibbon::ThornyMark,
            ),
            (
                "cobblemon:mark_personality_vigor",
                CobblemonRibbon::VigorMark,
            ),
            (
                "cobblemon:mark_personality_slump",
                CobblemonRibbon::SlumpMark,
            ),
            ("cobblemon:ribbon_hisui", CobblemonRibbon::Hisui),
            (
                "cobblemon:ribbon_contest_super_star_twinkling",
                CobblemonRibbon::TwinklingStar,
            ),
            (
                "cobblemon:ribbon_champion_paldea",
                CobblemonRibbon::PaldeaChampion,
            ),
            ("cobblemon:mark_jumbo", CobblemonRibbon::JumboMark),
            ("cobblemon:mark_mini", CobblemonRibbon::MiniMark),
            ("cobblemon:mark_itemfinder", CobblemonRibbon::ItemfinderMark),
            ("cobblemon:mark_partner", CobblemonRibbon::PartnerMark),
            ("cobblemon:mark_gourmand", CobblemonRibbon::GourmandMark),
            (
                "cobblemon:ribbon_once-in-a-lifetime",
                CobblemonRibbon::OnceInALifetime,
            ),
            ("cobblemon:mark_alpha", CobblemonRibbon::AlphaMark),
            ("cobblemon:mark_mightiest", CobblemonRibbon::MightiestMark),
            ("cobblemon:mark_titan", CobblemonRibbon::TitanMark),
            ("cobblemon:ribbon_partner", CobblemonRibbon::Partner),
        ])
    });
static COBBLEMON_BASE_MARK_MAP_OBSOLETE: LazyLock<BiHashMap<&str, CobblemonRibbon>> =
    LazyLock::new(|| {
        BiHashMap::from_iter([
            ("cobblemon:ribbon_battle_winning", CobblemonRibbon::Winning),
            ("cobblemon:ribbon_battle_victory", CobblemonRibbon::Victory),
            ("cobblemon:ribbon_ability", CobblemonRibbon::Ability),
            (
                "cobblemon:ribbon_ability_great",
                CobblemonRibbon::GreatAbility,
            ),
            (
                "cobblemon:ribbon_ability_double",
                CobblemonRibbon::DoubleAbility,
            ),
            (
                "cobblemon:ribbon_ability_multi",
                CobblemonRibbon::MultiAbility,
            ),
            (
                "cobblemon:ribbon_ability_pair",
                CobblemonRibbon::PairAbility,
            ),
            ("cobblemon:ribbon_ability_world", CobblemonRibbon::World),
            (
                "cobblemon:ribbon_contest_hoenn_cool_1",
                CobblemonRibbon::CoolHoenn,
            ),
            (
                "cobblemon:ribbon_contest_hoenn_cool_2",
                CobblemonRibbon::CoolSuperHoenn,
            ),
            (
                "cobblemon:ribbon_contest_hoenn_cool_3",
                CobblemonRibbon::CoolHyperHoenn,
            ),
            (
                "cobblemon:ribbon_contest_hoenn_cool_4",
                CobblemonRibbon::CoolMasterHoenn,
            ),
            (
                "cobblemon:ribbon_contest_hoenn_beauty_1",
                CobblemonRibbon::BeautyHoenn,
            ),
            (
                "cobblemon:ribbon_contest_hoenn_beauty_2",
                CobblemonRibbon::BeautySuperHoenn,
            ),
            (
                "cobblemon:ribbon_contest_hoenn_beauty_3",
                CobblemonRibbon::BeautyHyperHoenn,
            ),
            (
                "cobblemon:ribbon_contest_hoenn_beauty_4",
                CobblemonRibbon::BeautyMasterHoenn,
            ),
            (
                "cobblemon:ribbon_contest_hoenn_cute_1",
                CobblemonRibbon::CuteHoenn,
            ),
            (
                "cobblemon:ribbon_contest_hoenn_cute_2",
                CobblemonRibbon::CuteSuperHoenn,
            ),
            (
                "cobblemon:ribbon_contest_hoenn_cute_3",
                CobblemonRibbon::CuteHyperHoenn,
            ),
            (
                "cobblemon:ribbon_contest_hoenn_cute_4",
                CobblemonRibbon::CuteMasterHoenn,
            ),
            (
                "cobblemon:ribbon_contest_hoenn_smart_1",
                CobblemonRibbon::SmartHoenn,
            ),
            (
                "cobblemon:ribbon_contest_hoenn_smart_2",
                CobblemonRibbon::SmartSuperHoenn,
            ),
            (
                "cobblemon:ribbon_contest_hoenn_smart_3",
                CobblemonRibbon::SmartHyperHoenn,
            ),
            (
                "cobblemon:ribbon_contest_hoenn_smart_4",
                CobblemonRibbon::SmartMasterSinnoh,
            ),
            (
                "cobblemon:ribbon_contest_hoenn_tough_1",
                CobblemonRibbon::ToughHoenn,
            ),
            (
                "cobblemon:ribbon_contest_hoenn_tough_2",
                CobblemonRibbon::ToughSuperHoenn,
            ),
            (
                "cobblemon:ribbon_contest_hoenn_tough_3",
                CobblemonRibbon::ToughHyperHoenn,
            ),
            (
                "cobblemon:ribbon_contest_hoenn_tough_4",
                CobblemonRibbon::ToughMasterHoenn,
            ),
            (
                "cobblemon:ribbon_contest_sinnoh_cool_1",
                CobblemonRibbon::CoolSinnoh,
            ),
            (
                "cobblemon:ribbon_contest_sinnoh_cool_2",
                CobblemonRibbon::CoolGreatSinnoh,
            ),
            (
                "cobblemon:ribbon_contest_sinnoh_cool_3",
                CobblemonRibbon::CoolUltraSinnoh,
            ),
            (
                "cobblemon:ribbon_contest_sinnoh_cool_4",
                CobblemonRibbon::CoolMasterSinnoh,
            ),
            (
                "cobblemon:ribbon_contest_sinnoh_beauty_1",
                CobblemonRibbon::BeautySinnoh,
            ),
            (
                "cobblemon:ribbon_contest_sinnoh_beauty_2",
                CobblemonRibbon::BeautyGreatSinnoh,
            ),
            (
                "cobblemon:ribbon_contest_sinnoh_beauty_3",
                CobblemonRibbon::BeautyUltraSinnoh,
            ),
            (
                "cobblemon:ribbon_contest_sinnoh_beauty_4",
                CobblemonRibbon::BeautyMasterSinnoh,
            ),
            (
                "cobblemon:ribbon_contest_sinnoh_cute_1",
                CobblemonRibbon::CuteSinnoh,
            ),
            (
                "cobblemon:ribbon_contest_sinnoh_cute_2",
                CobblemonRibbon::CuteGreatSinnoh,
            ),
            (
                "cobblemon:ribbon_contest_sinnoh_cute_3",
                CobblemonRibbon::CuteUltraSinnoh,
            ),
            (
                "cobblemon:ribbon_contest_sinnoh_cute_4",
                CobblemonRibbon::CuteMasterSinnoh,
            ),
            (
                "cobblemon:ribbon_contest_sinnoh_smart_1",
                CobblemonRibbon::SmartSinnoh,
            ),
            (
                "cobblemon:ribbon_contest_sinnoh_smart_2",
                CobblemonRibbon::SmartGreatSinnoh,
            ),
            (
                "cobblemon:ribbon_contest_sinnoh_smart_3",
                CobblemonRibbon::SmartUltraSinnoh,
            ),
            (
                "cobblemon:ribbon_contest_sinnoh_smart_4",
                CobblemonRibbon::SmartMasterSinnoh,
            ),
            (
                "cobblemon:ribbon_contest_sinnoh_tough_1",
                CobblemonRibbon::ToughSinnoh,
            ),
            (
                "cobblemon:ribbon_contest_sinnoh_tough_2",
                CobblemonRibbon::ToughGreatSinnoh,
            ),
            (
                "cobblemon:ribbon_contest_sinnoh_tough_3",
                CobblemonRibbon::ToughUltraSinnoh,
            ),
            (
                "cobblemon:ribbon_contest_sinnoh_tough_4",
                CobblemonRibbon::ToughMasterSinnoh,
            ),
            // event ribbons deprecated after Gen 4
            ("cobblemon:ribbon_event_color_red", CobblemonRibbon::Red),
            ("cobblemon:ribbon_event_color_blue", CobblemonRibbon::Blue),
            ("cobblemon:ribbon_event_color_green", CobblemonRibbon::Green),
            (
                "cobblemon:ribbon_event_mystery_zone_land",
                CobblemonRibbon::Land,
            ),
            (
                "cobblemon:ribbon_event_mystery_zone_marine",
                CobblemonRibbon::Marine,
            ),
            (
                "cobblemon:ribbon_event_mystery_zone_sky",
                CobblemonRibbon::Sky,
            ),
        ])
    });

// known fanmade marks
static COBBLEMON_ADDON_MARK_MAP: LazyLock<BiHashMap<&str, CobblemonRibbon>> = LazyLock::new(|| {
    BiHashMap::from_iter([
        // Cobblemarks+
        ("cobblemon:mark_athlete", CobblemonRibbon::AthleteMark),
        ("cobblemon:mark_depths", CobblemonRibbon::DepthsMark),
        ("cobblemon:mark_gifted", CobblemonRibbon::GiftedMark),
        ("cobblemon:mark_incubator", CobblemonRibbon::IncubatorMark),
        ("cobblemon:mark_mantle", CobblemonRibbon::MantleMark),
        (
            "cobblemon:mark_melancholic",
            CobblemonRibbon::MelancholicMark,
        ),
        ("cobblemon:mark_metro", CobblemonRibbon::MetroMark),
        ("cobblemon:mark_riding_diver", CobblemonRibbon::DiverMark),
        (
            "cobblemon:mark_riding_stratus",
            CobblemonRibbon::StratusMark,
        ),
        (
            "cobblemon:mark_riding_trailblazer",
            CobblemonRibbon::TrailblazerMark,
        ),
        (
            "cobblemon:mark_season_blossom",
            CobblemonRibbon::BlossomMark,
        ),
        (
            "cobblemon:mark_season_harvest",
            CobblemonRibbon::HarvestMark,
        ),
        (
            "cobblemon:mark_season_snowfall",
            CobblemonRibbon::SnowfallMark,
        ),
        (
            "cobblemon:mark_season_sunshine",
            CobblemonRibbon::SunshineMark,
        ),
        ("cobblemon:mark_victory", CobblemonRibbon::VictoryMark),
    ])
});

static COBBLEMON_MARK_NAME_MAP: LazyLock<BiHashMap<CobblemonRibbon, &str>> = LazyLock::new(|| {
    BiHashMap::from_iter([
        (CobblemonRibbon::Winning, "Winning Ribbon"),
        (CobblemonRibbon::Victory, "Victory Ribbon"),
        (CobblemonRibbon::Ability, "Ability Ribbon"),
        (CobblemonRibbon::GreatAbility, "Great Ability Ribbon"),
        (CobblemonRibbon::DoubleAbility, "Double Ability Ribbon"),
        (CobblemonRibbon::MultiAbility, "Multi Ability Ribbon"),
        (CobblemonRibbon::PairAbility, "Pair Ability Ribbon"),
        (CobblemonRibbon::WorldAbility, "World Ability Ribbon"),
        (CobblemonRibbon::CoolHoenn, "Cool (Hoenn) Ribbon"),
        (CobblemonRibbon::CoolSuperHoenn, "Cool Super (Hoenn) Ribbon"),
        (CobblemonRibbon::CoolHyperHoenn, "Cool Hyper (Hoenn) Ribbon"),
        (
            CobblemonRibbon::CoolMasterHoenn,
            "Cool Master (Hoenn) Ribbon",
        ),
        (CobblemonRibbon::BeautyHoenn, "Beauty (Hoenn) Ribbon"),
        (
            CobblemonRibbon::BeautySuperHoenn,
            "Beauty Super (Hoenn) Ribbon",
        ),
        (
            CobblemonRibbon::BeautyHyperHoenn,
            "Beauty Hyper (Hoenn) Ribbon",
        ),
        (
            CobblemonRibbon::BeautyMasterHoenn,
            "Beauty Master (Hoenn) Ribbon",
        ),
        (CobblemonRibbon::CuteHoenn, "Cute (Hoenn) Ribbon"),
        (CobblemonRibbon::CuteSuperHoenn, "Cute Super (Hoenn) Ribbon"),
        (CobblemonRibbon::CuteHyperHoenn, "Cute Hyper (Hoenn) Ribbon"),
        (
            CobblemonRibbon::CuteMasterHoenn,
            "Cute Master (Hoenn) Ribbon",
        ),
        (CobblemonRibbon::SmartHoenn, "Smart (Hoenn) Ribbon"),
        (
            CobblemonRibbon::SmartSuperHoenn,
            "Smart Super (Hoenn) Ribbon",
        ),
        (
            CobblemonRibbon::SmartHyperHoenn,
            "Smart Hyper (Hoenn) Ribbon",
        ),
        (
            CobblemonRibbon::SmartMasterHoenn,
            "Smart Master (Hoenn) Ribbon",
        ),
        (CobblemonRibbon::ToughHoenn, "Tough (Hoenn) Ribbon"),
        (
            CobblemonRibbon::ToughSuperHoenn,
            "Tough Super (Hoenn) Ribbon",
        ),
        (
            CobblemonRibbon::ToughHyperHoenn,
            "Tough Hyper (Hoenn) Ribbon",
        ),
        (
            CobblemonRibbon::ToughMasterHoenn,
            "Tough Master (Hoenn) Ribbon",
        ),
        (CobblemonRibbon::CoolSinnoh, "Cool (Sinnoh) Ribbon"),
        (
            CobblemonRibbon::CoolGreatSinnoh,
            "Cool Great (Sinnoh) Ribbon",
        ),
        (
            CobblemonRibbon::CoolUltraSinnoh,
            "Cool Ultra (Sinnoh) Ribbon",
        ),
        (
            CobblemonRibbon::CoolMasterSinnoh,
            "Cool Master (Sinnoh) Ribbon",
        ),
        (CobblemonRibbon::BeautySinnoh, "Beauty (Sinnoh) Ribbon"),
        (
            CobblemonRibbon::BeautyGreatSinnoh,
            "Beauty Great (Sinnoh) Ribbon",
        ),
        (
            CobblemonRibbon::BeautyUltraSinnoh,
            "Beauty Ultra (Sinnoh) Ribbon",
        ),
        (
            CobblemonRibbon::BeautyMasterSinnoh,
            "Beauty Master (Sinnoh) Ribbon",
        ),
        (CobblemonRibbon::CuteSinnoh, "Cute (Sinnoh) Ribbon"),
        (
            CobblemonRibbon::CuteGreatSinnoh,
            "Cute Great (Sinnoh) Ribbon",
        ),
        (
            CobblemonRibbon::CuteUltraSinnoh,
            "Cute Ultra (Sinnoh) Ribbon",
        ),
        (
            CobblemonRibbon::CuteMasterSinnoh,
            "Cute Master (Sinnoh) Ribbon",
        ),
        (CobblemonRibbon::SmartSinnoh, "Smart (Sinnoh) Ribbon"),
        (
            CobblemonRibbon::SmartGreatSinnoh,
            "Smart Great (Sinnoh) Ribbon",
        ),
        (
            CobblemonRibbon::SmartUltraSinnoh,
            "Smart Ultra (Sinnoh) Ribbon",
        ),
        (
            CobblemonRibbon::SmartMasterSinnoh,
            "Smart Master (Sinnoh) Ribbon",
        ),
        (CobblemonRibbon::ToughSinnoh, "Tough (Sinnoh) Ribbon"),
        (
            CobblemonRibbon::ToughGreatSinnoh,
            "Tough Great (Sinnoh) Ribbon",
        ),
        (
            CobblemonRibbon::ToughUltraSinnoh,
            "Tough Ultra (Sinnoh) Ribbon",
        ),
        (
            CobblemonRibbon::ToughMasterSinnoh,
            "Tough Master (Sinnoh) Ribbon",
        ),
        (CobblemonRibbon::Red, "Red Ribbon"),
        (CobblemonRibbon::Blue, "Blue Ribbon"),
        (CobblemonRibbon::Green, "Green Ribbon"),
        (CobblemonRibbon::Land, "Land Ribbon"),
        (CobblemonRibbon::Marine, "Marine Ribbon"),
        (CobblemonRibbon::Sky, "Sky Ribbon"),
        (CobblemonRibbon::KalosChampion, "Kalos Champion Ribbon"),
        (CobblemonRibbon::Gen3Champion, "Champion Ribbon"),
        (CobblemonRibbon::SinnohChampion, "Sinnoh Champion Ribbon"),
        (CobblemonRibbon::BestFriends, "Best Friends Ribbon"),
        (CobblemonRibbon::Training, "Training Ribbon"),
        (CobblemonRibbon::SkillfulBattler, "Skillful Battler Ribbon"),
        (CobblemonRibbon::ExpertBattler, "Expert Battler Ribbon"),
        (CobblemonRibbon::Effort, "Effort Ribbon"),
        (CobblemonRibbon::Alert, "Alert Ribbon"),
        (CobblemonRibbon::Shock, "Shock Ribbon"),
        (CobblemonRibbon::Downcast, "Downcast Ribbon"),
        (CobblemonRibbon::Careless, "Careless Ribbon"),
        (CobblemonRibbon::Relax, "Relax Ribbon"),
        (CobblemonRibbon::Snooze, "Snooze Ribbon"),
        (CobblemonRibbon::Smile, "Smile Ribbon"),
        (CobblemonRibbon::Gorgeous, "Gorgeous Ribbon"),
        (CobblemonRibbon::Royal, "Royal Ribbon"),
        (CobblemonRibbon::GorgeousRoyal, "Gorgeous Royal Ribbon"),
        (CobblemonRibbon::Artist, "Artist Ribbon"),
        (CobblemonRibbon::Footprint, "Footprint Ribbon"),
        (CobblemonRibbon::Record, "Record Ribbon"),
        (CobblemonRibbon::Legend, "Legend Ribbon"),
        (CobblemonRibbon::Country, "Country Ribbon"),
        (CobblemonRibbon::National, "National Ribbon"),
        (CobblemonRibbon::Earth, "Earth Ribbon"),
        (CobblemonRibbon::World, "World Ribbon"),
        (CobblemonRibbon::Classic, "Classic Ribbon"),
        (CobblemonRibbon::Premier, "Premier Ribbon"),
        (CobblemonRibbon::Event, "Event Ribbon"),
        (CobblemonRibbon::Birthday, "Birthday Ribbon"),
        (CobblemonRibbon::Special, "Special Ribbon"),
        (CobblemonRibbon::Souvenir, "Souvenir Ribbon"),
        (CobblemonRibbon::Wishing, "Wishing Ribbon"),
        (CobblemonRibbon::BattleChampion, "Battle Champion Ribbon"),
        (
            CobblemonRibbon::RegionalChampion,
            "Regional Champion Ribbon",
        ),
        (
            CobblemonRibbon::NationalChampion,
            "National Champion Ribbon",
        ),
        (CobblemonRibbon::WorldChampion, "World Champion Ribbon"),
        (CobblemonRibbon::ContestMemory, "Contest Memory Ribbon"),
        (CobblemonRibbon::BattleMemory, "Battle Memory Ribbon"),
        (CobblemonRibbon::HoennChampion, "Hoenn Champion Ribbon"),
        (CobblemonRibbon::ContestStar, "Contest Star Ribbon"),
        (CobblemonRibbon::CoolnessMaster, "Coolness Master Ribbon"),
        (CobblemonRibbon::BeautyMaster, "Beauty Master Ribbon"),
        (CobblemonRibbon::CutenessMaster, "Cuteness Master Ribbon"),
        (
            CobblemonRibbon::ClevernessMaster,
            "Cleverness Master Ribbon",
        ),
        (CobblemonRibbon::ToughnessMaster, "Toughness Master Ribbon"),
        (CobblemonRibbon::AlolaChampion, "Alola Champion Ribbon"),
        (
            CobblemonRibbon::BattleRoyalChampion,
            "Battle Royal Champion Ribbon",
        ),
        (CobblemonRibbon::BattleTreeGreat, "Battle Tree Great Ribbon"),
        (
            CobblemonRibbon::BattleTreeMaster,
            "Battle Tree Master Ribbon",
        ),
        (CobblemonRibbon::GalarChampion, "Galar Champion Ribbon"),
        (CobblemonRibbon::TowerMaster, "Tower Master Ribbon"),
        (CobblemonRibbon::MasterRank, "Master Rank Ribbon"),
        (CobblemonRibbon::LunchtimeMark, "Lunchtime Mark"),
        (CobblemonRibbon::SleepyTimeMark, "Sleepy-Time Mark"),
        (CobblemonRibbon::DuskMark, "Dusk Mark"),
        (CobblemonRibbon::DawnMark, "Dawn Mark"),
        (CobblemonRibbon::CloudyMark, "Cloudy Mark"),
        (CobblemonRibbon::RainyMark, "Rainy Mark"),
        (CobblemonRibbon::StormyMark, "Stormy Mark"),
        (CobblemonRibbon::SnowyMark, "Snowy Mark"),
        (CobblemonRibbon::BlizzardMark, "Blizzard Mark"),
        (CobblemonRibbon::DryMark, "Dry Mark"),
        (CobblemonRibbon::SandstormMark, "Sandstorm Mark"),
        (CobblemonRibbon::MistyMark, "Misty Mark"),
        (CobblemonRibbon::DestinyMark, "Destiny Mark"),
        (CobblemonRibbon::FishingMark, "Fishing Mark"),
        (CobblemonRibbon::CurryMark, "Curry Mark"),
        (CobblemonRibbon::UncommonMark, "Uncommon Mark"),
        (CobblemonRibbon::RareMark, "Rare Mark"),
        (CobblemonRibbon::RowdyMark, "Rowdy Mark"),
        (CobblemonRibbon::AbsentMindedMark, "Absent-Minded Mark"),
        (CobblemonRibbon::JitteryMark, "Jittery Mark"),
        (CobblemonRibbon::ExcitedMark, "Excited Mark"),
        (CobblemonRibbon::CharismaticMark, "Charismatic Mark"),
        (CobblemonRibbon::CalmnessMark, "Calmness Mark"),
        (CobblemonRibbon::IntenseMark, "Intense Mark"),
        (CobblemonRibbon::ZonedOutMark, "Zoned-Out Mark"),
        (CobblemonRibbon::JoyfulMark, "Joyful Mark"),
        (CobblemonRibbon::AngryMark, "Angry Mark"),
        (CobblemonRibbon::SmileyMark, "Smiley Mark"),
        (CobblemonRibbon::TearyMark, "Teary Mark"),
        (CobblemonRibbon::UpbeatMark, "Upbeat Mark"),
        (CobblemonRibbon::PeevedMark, "Peeved Mark"),
        (CobblemonRibbon::IntellectualMark, "Intellectual Mark"),
        (CobblemonRibbon::FerociousMark, "Ferocious Mark"),
        (CobblemonRibbon::CraftyMark, "Crafty Mark"),
        (CobblemonRibbon::ScowlingMark, "Scowling Mark"),
        (CobblemonRibbon::KindlyMark, "Kindly Mark"),
        (CobblemonRibbon::FlusteredMark, "Flustered Mark"),
        (CobblemonRibbon::PumpedUpMark, "Pumped-Up Mark"),
        (CobblemonRibbon::ZeroEnergyMark, "Zero Energy Mark"),
        (CobblemonRibbon::PridefulMark, "Prideful Mark"),
        (CobblemonRibbon::UnsureMark, "Unsure Mark"),
        (CobblemonRibbon::HumbleMark, "Humble Mark"),
        (CobblemonRibbon::ThornyMark, "Thorny Mark"),
        (CobblemonRibbon::VigorMark, "Vigor Mark"),
        (CobblemonRibbon::SlumpMark, "Slump Mark"),
        (CobblemonRibbon::Hisui, "Hisui Ribbon"),
        (CobblemonRibbon::TwinklingStar, "Twinkling Star Ribbon"),
        (CobblemonRibbon::PaldeaChampion, "Paldea Champion Ribbon"),
        (CobblemonRibbon::JumboMark, "Jumbo Mark"),
        (CobblemonRibbon::MiniMark, "Mini Mark"),
        (CobblemonRibbon::ItemfinderMark, "Itemfinder Mark"),
        (CobblemonRibbon::PartnerMark, "Partner Mark"),
        (CobblemonRibbon::GourmandMark, "Gourmand Mark"),
        (
            CobblemonRibbon::OnceInALifetime,
            "Once-in-a-Lifetime Ribbon",
        ),
        (CobblemonRibbon::AlphaMark, "Alpha Mark"),
        (CobblemonRibbon::MightiestMark, "Mightiest Mark"),
        (CobblemonRibbon::TitanMark, "Titan Mark"),
        (CobblemonRibbon::Partner, "Partner Ribbon"),
        (CobblemonRibbon::AthleteMark, "Athlete Mark"),
        (CobblemonRibbon::DepthsMark, "Depths Mark"),
        (CobblemonRibbon::GiftedMark, "Gifted Mark"),
        (CobblemonRibbon::IncubatorMark, "Incubator Mark"),
        (CobblemonRibbon::MantleMark, "Mantle Mark"),
        (CobblemonRibbon::MelancholicMark, "Melancholic Mark"),
        (CobblemonRibbon::MetroMark, "Metro Mark"),
        (CobblemonRibbon::DiverMark, "Diver Mark"),
        (CobblemonRibbon::StratusMark, "Stratus Mark"),
        (CobblemonRibbon::TrailblazerMark, "Trailblazer Mark"),
        (CobblemonRibbon::BlossomMark, "Blossom Mark"),
        (CobblemonRibbon::HarvestMark, "Harvest Mark"),
        (CobblemonRibbon::SnowfallMark, "Snowfall Mark"),
        (CobblemonRibbon::SunshineMark, "Sunshine Mark"),
        (CobblemonRibbon::VictoryMark, "Victory Mark"),
    ])
});

static COBBLEMON_MARK_INDEX_MAP: LazyLock<BiHashMap<usize, CobblemonRibbon>> =
    LazyLock::new(|| {
        BiHashMap::from_iter([
            (0, CobblemonRibbon::Winning),
            (1, CobblemonRibbon::Victory),
            (2, CobblemonRibbon::Ability),
            (3, CobblemonRibbon::GreatAbility),
            (4, CobblemonRibbon::DoubleAbility),
            (5, CobblemonRibbon::MultiAbility),
            (6, CobblemonRibbon::PairAbility),
            (7, CobblemonRibbon::WorldAbility),
            (8, CobblemonRibbon::CoolHoenn),
            (9, CobblemonRibbon::CoolSuperHoenn),
            (10, CobblemonRibbon::CoolHyperHoenn),
            (11, CobblemonRibbon::CoolMasterHoenn),
            (12, CobblemonRibbon::BeautyHoenn),
            (13, CobblemonRibbon::BeautySuperHoenn),
            (14, CobblemonRibbon::BeautyHyperHoenn),
            (15, CobblemonRibbon::BeautyMasterHoenn),
            (16, CobblemonRibbon::CuteHoenn),
            (17, CobblemonRibbon::CuteSuperHoenn),
            (18, CobblemonRibbon::CuteHyperHoenn),
            (19, CobblemonRibbon::CuteMasterHoenn),
            (20, CobblemonRibbon::SmartHoenn),
            (21, CobblemonRibbon::SmartSuperHoenn),
            (22, CobblemonRibbon::SmartHyperHoenn),
            (23, CobblemonRibbon::SmartMasterHoenn),
            (24, CobblemonRibbon::ToughHoenn),
            (25, CobblemonRibbon::ToughSuperHoenn),
            (26, CobblemonRibbon::ToughHyperHoenn),
            (27, CobblemonRibbon::ToughMasterHoenn),
            (28, CobblemonRibbon::CoolSinnoh),
            (29, CobblemonRibbon::CoolGreatSinnoh),
            (30, CobblemonRibbon::CoolUltraSinnoh),
            (31, CobblemonRibbon::CoolMasterSinnoh),
            (32, CobblemonRibbon::BeautySinnoh),
            (33, CobblemonRibbon::BeautyGreatSinnoh),
            (34, CobblemonRibbon::BeautyUltraSinnoh),
            (35, CobblemonRibbon::BeautyMasterSinnoh),
            (36, CobblemonRibbon::CuteSinnoh),
            (37, CobblemonRibbon::CuteGreatSinnoh),
            (38, CobblemonRibbon::CuteUltraSinnoh),
            (39, CobblemonRibbon::CuteMasterSinnoh),
            (40, CobblemonRibbon::SmartSinnoh),
            (41, CobblemonRibbon::SmartGreatSinnoh),
            (42, CobblemonRibbon::SmartUltraSinnoh),
            (43, CobblemonRibbon::SmartMasterSinnoh),
            (44, CobblemonRibbon::ToughSinnoh),
            (45, CobblemonRibbon::ToughGreatSinnoh),
            (46, CobblemonRibbon::ToughUltraSinnoh),
            (47, CobblemonRibbon::ToughMasterSinnoh),
            (48, CobblemonRibbon::Red),
            (49, CobblemonRibbon::Blue),
            (50, CobblemonRibbon::Green),
            (51, CobblemonRibbon::Land),
            (52, CobblemonRibbon::Marine),
            (53, CobblemonRibbon::Sky),
            (54, CobblemonRibbon::KalosChampion),
            (55, CobblemonRibbon::Gen3Champion),
            (56, CobblemonRibbon::SinnohChampion),
            (57, CobblemonRibbon::BestFriends),
            (58, CobblemonRibbon::Training),
            (59, CobblemonRibbon::SkillfulBattler),
            (60, CobblemonRibbon::ExpertBattler),
            (61, CobblemonRibbon::Effort),
            (62, CobblemonRibbon::Alert),
            (63, CobblemonRibbon::Shock),
            (64, CobblemonRibbon::Downcast),
            (65, CobblemonRibbon::Careless),
            (66, CobblemonRibbon::Relax),
            (67, CobblemonRibbon::Snooze),
            (68, CobblemonRibbon::Smile),
            (69, CobblemonRibbon::Gorgeous),
            (70, CobblemonRibbon::Royal),
            (71, CobblemonRibbon::GorgeousRoyal),
            (72, CobblemonRibbon::Artist),
            (73, CobblemonRibbon::Footprint),
            (74, CobblemonRibbon::Record),
            (75, CobblemonRibbon::Legend),
            (76, CobblemonRibbon::Country),
            (77, CobblemonRibbon::National),
            (78, CobblemonRibbon::Earth),
            (79, CobblemonRibbon::World),
            (80, CobblemonRibbon::Classic),
            (81, CobblemonRibbon::Premier),
            (82, CobblemonRibbon::Event),
            (83, CobblemonRibbon::Birthday),
            (84, CobblemonRibbon::Special),
            (85, CobblemonRibbon::Souvenir),
            (86, CobblemonRibbon::Wishing),
            (87, CobblemonRibbon::BattleChampion),
            (88, CobblemonRibbon::RegionalChampion),
            (89, CobblemonRibbon::NationalChampion),
            (90, CobblemonRibbon::WorldChampion),
            (91, CobblemonRibbon::ContestMemory),
            (92, CobblemonRibbon::BattleMemory),
            (93, CobblemonRibbon::HoennChampion),
            (94, CobblemonRibbon::ContestStar),
            (95, CobblemonRibbon::CoolnessMaster),
            (96, CobblemonRibbon::BeautyMaster),
            (97, CobblemonRibbon::CutenessMaster),
            (98, CobblemonRibbon::ClevernessMaster),
            (99, CobblemonRibbon::ToughnessMaster),
            (100, CobblemonRibbon::AlolaChampion),
            (101, CobblemonRibbon::BattleRoyalChampion),
            (102, CobblemonRibbon::BattleTreeGreat),
            (103, CobblemonRibbon::BattleTreeMaster),
            (104, CobblemonRibbon::GalarChampion),
            (105, CobblemonRibbon::TowerMaster),
            (106, CobblemonRibbon::MasterRank),
            (107, CobblemonRibbon::LunchtimeMark),
            (108, CobblemonRibbon::SleepyTimeMark),
            (109, CobblemonRibbon::DuskMark),
            (110, CobblemonRibbon::DawnMark),
            (111, CobblemonRibbon::CloudyMark),
            (112, CobblemonRibbon::RainyMark),
            (113, CobblemonRibbon::StormyMark),
            (114, CobblemonRibbon::SnowyMark),
            (115, CobblemonRibbon::BlizzardMark),
            (116, CobblemonRibbon::DryMark),
            (117, CobblemonRibbon::SandstormMark),
            (118, CobblemonRibbon::MistyMark),
            (119, CobblemonRibbon::DestinyMark),
            (120, CobblemonRibbon::FishingMark),
            (121, CobblemonRibbon::CurryMark),
            (122, CobblemonRibbon::UncommonMark),
            (123, CobblemonRibbon::RareMark),
            (124, CobblemonRibbon::RowdyMark),
            (125, CobblemonRibbon::AbsentMindedMark),
            (126, CobblemonRibbon::JitteryMark),
            (127, CobblemonRibbon::ExcitedMark),
            (128, CobblemonRibbon::CharismaticMark),
            (129, CobblemonRibbon::CalmnessMark),
            (130, CobblemonRibbon::IntenseMark),
            (131, CobblemonRibbon::ZonedOutMark),
            (132, CobblemonRibbon::JoyfulMark),
            (133, CobblemonRibbon::AngryMark),
            (134, CobblemonRibbon::SmileyMark),
            (135, CobblemonRibbon::TearyMark),
            (136, CobblemonRibbon::UpbeatMark),
            (137, CobblemonRibbon::PeevedMark),
            (138, CobblemonRibbon::IntellectualMark),
            (139, CobblemonRibbon::FerociousMark),
            (140, CobblemonRibbon::CraftyMark),
            (141, CobblemonRibbon::ScowlingMark),
            (142, CobblemonRibbon::KindlyMark),
            (143, CobblemonRibbon::FlusteredMark),
            (144, CobblemonRibbon::PumpedUpMark),
            (145, CobblemonRibbon::ZeroEnergyMark),
            (146, CobblemonRibbon::PridefulMark),
            (147, CobblemonRibbon::UnsureMark),
            (148, CobblemonRibbon::HumbleMark),
            (149, CobblemonRibbon::ThornyMark),
            (150, CobblemonRibbon::VigorMark),
            (151, CobblemonRibbon::SlumpMark),
            (152, CobblemonRibbon::Hisui),
            (153, CobblemonRibbon::TwinklingStar),
            (154, CobblemonRibbon::PaldeaChampion),
            (155, CobblemonRibbon::JumboMark),
            (156, CobblemonRibbon::MiniMark),
            (157, CobblemonRibbon::ItemfinderMark),
            (158, CobblemonRibbon::PartnerMark),
            (159, CobblemonRibbon::GourmandMark),
            (160, CobblemonRibbon::OnceInALifetime),
            (161, CobblemonRibbon::AlphaMark),
            (162, CobblemonRibbon::MightiestMark),
            (163, CobblemonRibbon::TitanMark),
            (164, CobblemonRibbon::Partner),
            (165, CobblemonRibbon::AthleteMark),
            (166, CobblemonRibbon::DepthsMark),
            (167, CobblemonRibbon::GiftedMark),
            (168, CobblemonRibbon::IncubatorMark),
            (169, CobblemonRibbon::MantleMark),
            (170, CobblemonRibbon::MelancholicMark),
            (171, CobblemonRibbon::MetroMark),
            (172, CobblemonRibbon::DiverMark),
            (173, CobblemonRibbon::StratusMark),
            (174, CobblemonRibbon::TrailblazerMark),
            (175, CobblemonRibbon::BlossomMark),
            (176, CobblemonRibbon::HarvestMark),
            (177, CobblemonRibbon::SnowfallMark),
            (178, CobblemonRibbon::SunshineMark),
            (179, CobblemonRibbon::VictoryMark),
        ])
    });

pub const COBBLEMON_MARK_MAX: usize = CobblemonRibbon::VictoryMark as usize;

pub type CobblemonRibbonSet<const N: usize, const MAX: usize = COBBLEMON_MARK_MAX> =
    RibbonSet<N, CobblemonRibbon, MAX>;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd)]
pub enum CobblemonRibbon {
    // ObsoleteRibbon
    Winning,
    Victory,
    Ability,
    GreatAbility,
    DoubleAbility,
    MultiAbility,
    PairAbility,
    WorldAbility,
    CoolHoenn,
    CoolSuperHoenn,
    CoolHyperHoenn,
    CoolMasterHoenn,
    BeautyHoenn,
    BeautySuperHoenn,
    BeautyHyperHoenn,
    BeautyMasterHoenn,
    CuteHoenn,
    CuteSuperHoenn,
    CuteHyperHoenn,
    CuteMasterHoenn,
    SmartHoenn,
    SmartSuperHoenn,
    SmartHyperHoenn,
    SmartMasterHoenn,
    ToughHoenn,
    ToughSuperHoenn,
    ToughHyperHoenn,
    ToughMasterHoenn,
    CoolSinnoh,
    CoolGreatSinnoh,
    CoolUltraSinnoh,
    CoolMasterSinnoh,
    BeautySinnoh,
    BeautyGreatSinnoh,
    BeautyUltraSinnoh,
    BeautyMasterSinnoh,
    CuteSinnoh,
    CuteGreatSinnoh,
    CuteUltraSinnoh,
    CuteMasterSinnoh,
    SmartSinnoh,
    SmartGreatSinnoh,
    SmartUltraSinnoh,
    SmartMasterSinnoh,
    ToughSinnoh,
    ToughGreatSinnoh,
    ToughUltraSinnoh,
    ToughMasterSinnoh,
    // event ribbons deprecated after Gen 4
    Red,
    Blue,
    Green,
    Land,
    Marine,
    Sky,
    // ModernRibbon up to Gen 9
    KalosChampion,
    Gen3Champion,
    SinnohChampion,
    BestFriends,
    Training,
    SkillfulBattler,
    ExpertBattler,
    Effort,
    Alert,
    Shock,
    Downcast,
    Careless,
    Relax,
    Snooze,
    Smile,
    Gorgeous,
    Royal,
    GorgeousRoyal,
    Artist,
    Footprint,
    Record,
    Legend,
    Country,
    National,
    Earth,
    World,
    Classic,
    Premier,
    Event,
    Birthday,
    Special,
    Souvenir,
    Wishing,
    BattleChampion,
    RegionalChampion,
    NationalChampion,
    WorldChampion,
    ContestMemory,
    BattleMemory,
    HoennChampion,
    ContestStar,
    CoolnessMaster,
    BeautyMaster,
    CutenessMaster,
    ClevernessMaster,
    ToughnessMaster,
    AlolaChampion,
    BattleRoyalChampion,
    BattleTreeGreat,
    BattleTreeMaster,
    GalarChampion,
    TowerMaster,
    MasterRank,
    LunchtimeMark,
    SleepyTimeMark,
    DuskMark,
    DawnMark,
    CloudyMark,
    RainyMark,
    StormyMark,
    SnowyMark,
    BlizzardMark,
    DryMark,
    SandstormMark,
    MistyMark,
    DestinyMark,
    FishingMark,
    CurryMark,
    UncommonMark,
    RareMark,
    RowdyMark,
    AbsentMindedMark,
    JitteryMark,
    ExcitedMark,
    CharismaticMark,
    CalmnessMark,
    IntenseMark,
    ZonedOutMark,
    JoyfulMark,
    AngryMark,
    SmileyMark,
    TearyMark,
    UpbeatMark,
    PeevedMark,
    IntellectualMark,
    FerociousMark,
    CraftyMark,
    ScowlingMark,
    KindlyMark,
    FlusteredMark,
    PumpedUpMark,
    ZeroEnergyMark,
    PridefulMark,
    UnsureMark,
    HumbleMark,
    ThornyMark,
    VigorMark,
    SlumpMark,
    Hisui,
    TwinklingStar,
    PaldeaChampion,
    JumboMark,
    MiniMark,
    ItemfinderMark,
    PartnerMark,
    GourmandMark,
    OnceInALifetime,
    AlphaMark,
    MightiestMark,
    TitanMark,
    Partner,
    // Cobblemarks+ 1.2.2
    AthleteMark,
    DepthsMark,
    GiftedMark,
    IncubatorMark,
    MantleMark,
    MelancholicMark,
    MetroMark,
    DiverMark,
    StratusMark,
    TrailblazerMark,
    BlossomMark,
    HarvestMark,
    SnowfallMark,
    SunshineMark,
    VictoryMark,
}

impl CobblemonRibbon {
    pub const MAX: usize = COBBLEMON_MARK_MAX;
    pub fn name(&self) -> &'static str {
        COBBLEMON_MARK_NAME_MAP
            .get_by_left(self)
            .copied()
            .expect("CobblemonRibbon is valid")
    }

    pub fn from_cobblemon_resource_id(id: &str) -> Option<Self> {
        if COBBLEMON_BASE_MARK_MAP_MODERN.contains_left(&id) {
            COBBLEMON_BASE_MARK_MAP_MODERN.get_by_left(&id).copied()
        } else if COBBLEMON_BASE_MARK_MAP_OBSOLETE.contains_left(&id) {
            COBBLEMON_BASE_MARK_MAP_OBSOLETE.get_by_left(&id).copied()
        } else if COBBLEMON_ADDON_MARK_MAP.contains_left(&id) {
            COBBLEMON_ADDON_MARK_MAP.get_by_left(&id).copied()
        } else {
            panic!("Cobblemon ribbon not defined in any map")
        }
    }

    pub fn to_cobblemon_resource_id(ribbon: Self) -> Option<&'static str> {
        if COBBLEMON_BASE_MARK_MAP_MODERN.contains_right(&ribbon) {
            COBBLEMON_BASE_MARK_MAP_MODERN
                .get_by_right(&ribbon)
                .copied()
        } else if COBBLEMON_BASE_MARK_MAP_OBSOLETE.contains_right(&ribbon) {
            COBBLEMON_BASE_MARK_MAP_OBSOLETE
                .get_by_right(&ribbon)
                .copied()
        } else if COBBLEMON_ADDON_MARK_MAP.contains_right(&ribbon) {
            COBBLEMON_ADDON_MARK_MAP.get_by_right(&ribbon).copied()
        } else {
            panic!("Cobblemon ribbon not defined in any map")
        }
    }

    pub fn from_index(value: impl Into<usize>) -> Option<Self> {
        COBBLEMON_MARK_INDEX_MAP.get_by_left(&value.into()).copied()
    }

    pub fn get_index(&self) -> usize {
        COBBLEMON_MARK_INDEX_MAP
            .get_by_right(self)
            .copied()
            .expect("CobblemonRibbon is valid")
    }

    pub const fn from_modern_if_present(modern: ModernRibbon) -> Option<Self> {
        match modern {
            ModernRibbon::KalosChampion => Some(CobblemonRibbon::KalosChampion),
            ModernRibbon::Gen3Champion => Some(CobblemonRibbon::Gen3Champion),
            ModernRibbon::SinnohChampion => Some(CobblemonRibbon::SinnohChampion),
            ModernRibbon::BestFriends => Some(CobblemonRibbon::BestFriends),
            ModernRibbon::Training => Some(CobblemonRibbon::Training),
            ModernRibbon::SkillfulBattler => Some(CobblemonRibbon::SkillfulBattler),
            ModernRibbon::ExpertBattler => Some(CobblemonRibbon::ExpertBattler),
            ModernRibbon::Effort => Some(CobblemonRibbon::Effort),
            ModernRibbon::Alert => Some(CobblemonRibbon::Alert),
            ModernRibbon::Shock => Some(CobblemonRibbon::Shock),
            ModernRibbon::Downcast => Some(CobblemonRibbon::Downcast),
            ModernRibbon::Careless => Some(CobblemonRibbon::Careless),
            ModernRibbon::Relax => Some(CobblemonRibbon::Relax),
            ModernRibbon::Snooze => Some(CobblemonRibbon::Snooze),
            ModernRibbon::Smile => Some(CobblemonRibbon::Smile),
            ModernRibbon::Gorgeous => Some(CobblemonRibbon::Gorgeous),
            ModernRibbon::Royal => Some(CobblemonRibbon::Royal),
            ModernRibbon::GorgeousRoyal => Some(CobblemonRibbon::GorgeousRoyal),
            ModernRibbon::Artist => Some(CobblemonRibbon::Artist),
            ModernRibbon::Footprint => Some(CobblemonRibbon::Footprint),
            ModernRibbon::Record => Some(CobblemonRibbon::Record),
            ModernRibbon::Legend => Some(CobblemonRibbon::Legend),
            ModernRibbon::Country => Some(CobblemonRibbon::Country),
            ModernRibbon::National => Some(CobblemonRibbon::National),
            ModernRibbon::Earth => Some(CobblemonRibbon::Earth),
            ModernRibbon::World => Some(CobblemonRibbon::World),
            ModernRibbon::Classic => Some(CobblemonRibbon::Classic),
            ModernRibbon::Premier => Some(CobblemonRibbon::Premier),
            ModernRibbon::Event => Some(CobblemonRibbon::Event),
            ModernRibbon::Birthday => Some(CobblemonRibbon::Birthday),
            ModernRibbon::Special => Some(CobblemonRibbon::Special),
            ModernRibbon::Souvenir => Some(CobblemonRibbon::Souvenir),
            ModernRibbon::Wishing => Some(CobblemonRibbon::Wishing),
            ModernRibbon::BattleChampion => Some(CobblemonRibbon::BattleChampion),
            ModernRibbon::RegionalChampion => Some(CobblemonRibbon::RegionalChampion),
            ModernRibbon::NationalChampion => Some(CobblemonRibbon::NationalChampion),
            ModernRibbon::WorldChampion => Some(CobblemonRibbon::WorldChampion),
            ModernRibbon::ContestMemory => Some(CobblemonRibbon::ContestMemory),
            ModernRibbon::BattleMemory => Some(CobblemonRibbon::BattleMemory),
            ModernRibbon::HoennChampion => Some(CobblemonRibbon::HoennChampion),
            ModernRibbon::ContestStar => Some(CobblemonRibbon::ContestStar),
            ModernRibbon::CoolnessMaster => Some(CobblemonRibbon::CoolnessMaster),
            ModernRibbon::BeautyMaster => Some(CobblemonRibbon::BeautyMaster),
            ModernRibbon::CutenessMaster => Some(CobblemonRibbon::CutenessMaster),
            ModernRibbon::ClevernessMaster => Some(CobblemonRibbon::ClevernessMaster),
            ModernRibbon::ToughnessMaster => Some(CobblemonRibbon::ToughnessMaster),
            ModernRibbon::AlolaChampion => Some(CobblemonRibbon::AlolaChampion),
            ModernRibbon::BattleRoyalChampion => Some(CobblemonRibbon::BattleRoyalChampion),
            ModernRibbon::BattleTreeGreat => Some(CobblemonRibbon::BattleTreeGreat),
            ModernRibbon::BattleTreeMaster => Some(CobblemonRibbon::BattleTreeMaster),
            ModernRibbon::GalarChampion => Some(CobblemonRibbon::GalarChampion),
            ModernRibbon::TowerMaster => Some(CobblemonRibbon::TowerMaster),
            ModernRibbon::MasterRank => Some(CobblemonRibbon::MasterRank),
            ModernRibbon::LunchtimeMark => Some(CobblemonRibbon::LunchtimeMark),
            ModernRibbon::SleepyTimeMark => Some(CobblemonRibbon::SleepyTimeMark),
            ModernRibbon::DuskMark => Some(CobblemonRibbon::DuskMark),
            ModernRibbon::DawnMark => Some(CobblemonRibbon::DawnMark),
            ModernRibbon::CloudyMark => Some(CobblemonRibbon::CloudyMark),
            ModernRibbon::RainyMark => Some(CobblemonRibbon::RainyMark),
            ModernRibbon::StormyMark => Some(CobblemonRibbon::StormyMark),
            ModernRibbon::SnowyMark => Some(CobblemonRibbon::SnowyMark),
            ModernRibbon::BlizzardMark => Some(CobblemonRibbon::BlizzardMark),
            ModernRibbon::DryMark => Some(CobblemonRibbon::DryMark),
            ModernRibbon::SandstormMark => Some(CobblemonRibbon::SandstormMark),
            ModernRibbon::MistyMark => Some(CobblemonRibbon::MistyMark),
            ModernRibbon::DestinyMark => Some(CobblemonRibbon::DestinyMark),
            ModernRibbon::FishingMark => Some(CobblemonRibbon::FishingMark),
            ModernRibbon::CurryMark => Some(CobblemonRibbon::CurryMark),
            ModernRibbon::UncommonMark => Some(CobblemonRibbon::UncommonMark),
            ModernRibbon::RareMark => Some(CobblemonRibbon::RareMark),
            ModernRibbon::RowdyMark => Some(CobblemonRibbon::RowdyMark),
            ModernRibbon::AbsentMindedMark => Some(CobblemonRibbon::AbsentMindedMark),
            ModernRibbon::JitteryMark => Some(CobblemonRibbon::JitteryMark),
            ModernRibbon::ExcitedMark => Some(CobblemonRibbon::ExcitedMark),
            ModernRibbon::CharismaticMark => Some(CobblemonRibbon::CharismaticMark),
            ModernRibbon::CalmnessMark => Some(CobblemonRibbon::CalmnessMark),
            ModernRibbon::IntenseMark => Some(CobblemonRibbon::IntenseMark),
            ModernRibbon::ZonedOutMark => Some(CobblemonRibbon::ZonedOutMark),
            ModernRibbon::JoyfulMark => Some(CobblemonRibbon::JoyfulMark),
            ModernRibbon::AngryMark => Some(CobblemonRibbon::AngryMark),
            ModernRibbon::SmileyMark => Some(CobblemonRibbon::SmileyMark),
            ModernRibbon::TearyMark => Some(CobblemonRibbon::TearyMark),
            ModernRibbon::UpbeatMark => Some(CobblemonRibbon::UpbeatMark),
            ModernRibbon::PeevedMark => Some(CobblemonRibbon::PeevedMark),
            ModernRibbon::IntellectualMark => Some(CobblemonRibbon::IntellectualMark),
            ModernRibbon::FerociousMark => Some(CobblemonRibbon::FerociousMark),
            ModernRibbon::CraftyMark => Some(CobblemonRibbon::CraftyMark),
            ModernRibbon::ScowlingMark => Some(CobblemonRibbon::ScowlingMark),
            ModernRibbon::KindlyMark => Some(CobblemonRibbon::KindlyMark),
            ModernRibbon::FlusteredMark => Some(CobblemonRibbon::FlusteredMark),
            ModernRibbon::PumpedUpMark => Some(CobblemonRibbon::PumpedUpMark),
            ModernRibbon::ZeroEnergyMark => Some(CobblemonRibbon::ZeroEnergyMark),
            ModernRibbon::PridefulMark => Some(CobblemonRibbon::PridefulMark),
            ModernRibbon::UnsureMark => Some(CobblemonRibbon::UnsureMark),
            ModernRibbon::HumbleMark => Some(CobblemonRibbon::HumbleMark),
            ModernRibbon::ThornyMark => Some(CobblemonRibbon::ThornyMark),
            ModernRibbon::VigorMark => Some(CobblemonRibbon::VigorMark),
            ModernRibbon::SlumpMark => Some(CobblemonRibbon::SlumpMark),
            ModernRibbon::Hisui => Some(CobblemonRibbon::Hisui),
            ModernRibbon::TwinklingStar => Some(CobblemonRibbon::TwinklingStar),
            ModernRibbon::PaldeaChampion => Some(CobblemonRibbon::PaldeaChampion),
            ModernRibbon::JumboMark => Some(CobblemonRibbon::JumboMark),
            ModernRibbon::MiniMark => Some(CobblemonRibbon::MiniMark),
            ModernRibbon::ItemfinderMark => Some(CobblemonRibbon::ItemfinderMark),
            ModernRibbon::PartnerMark => Some(CobblemonRibbon::PartnerMark),
            ModernRibbon::GourmandMark => Some(CobblemonRibbon::GourmandMark),
            ModernRibbon::OnceInALifetime => Some(CobblemonRibbon::OnceInALifetime),
            ModernRibbon::AlphaMark => Some(CobblemonRibbon::AlphaMark),
            ModernRibbon::MightiestMark => Some(CobblemonRibbon::MightiestMark),
            ModernRibbon::TitanMark => Some(CobblemonRibbon::TitanMark),
            ModernRibbon::Partner => Some(CobblemonRibbon::Partner),
        }
    }

    pub const fn from_obsolete_if_present(obsolete: ObsoleteRibbon) -> Option<Self> {
        match obsolete {
            ObsoleteRibbon::Winning => Some(CobblemonRibbon::Winning),
            ObsoleteRibbon::Victory => Some(CobblemonRibbon::Victory),
            ObsoleteRibbon::Ability => Some(CobblemonRibbon::Ability),
            ObsoleteRibbon::GreatAbility => Some(CobblemonRibbon::GreatAbility),
            ObsoleteRibbon::DoubleAbility => Some(CobblemonRibbon::DoubleAbility),
            ObsoleteRibbon::MultiAbility => Some(CobblemonRibbon::MultiAbility),
            ObsoleteRibbon::PairAbility => Some(CobblemonRibbon::PairAbility),
            ObsoleteRibbon::WorldAbility => Some(CobblemonRibbon::WorldAbility),
            ObsoleteRibbon::CoolHoenn => Some(CobblemonRibbon::CoolHoenn),
            ObsoleteRibbon::CoolSuperHoenn => Some(CobblemonRibbon::CoolSuperHoenn),
            ObsoleteRibbon::CoolHyperHoenn => Some(CobblemonRibbon::CoolHyperHoenn),
            ObsoleteRibbon::CoolMasterHoenn => Some(CobblemonRibbon::CoolMasterHoenn),
            ObsoleteRibbon::BeautyHoenn => Some(CobblemonRibbon::BeautyHoenn),
            ObsoleteRibbon::BeautySuperHoenn => Some(CobblemonRibbon::BeautySuperHoenn),
            ObsoleteRibbon::BeautyHyperHoenn => Some(CobblemonRibbon::BeautyHyperHoenn),
            ObsoleteRibbon::BeautyMasterHoenn => Some(CobblemonRibbon::BeautyMasterHoenn),
            ObsoleteRibbon::CuteHoenn => Some(CobblemonRibbon::CuteHoenn),
            ObsoleteRibbon::CuteSuperHoenn => Some(CobblemonRibbon::CuteSuperHoenn),
            ObsoleteRibbon::CuteHyperHoenn => Some(CobblemonRibbon::CuteHyperHoenn),
            ObsoleteRibbon::CuteMasterHoenn => Some(CobblemonRibbon::CuteMasterHoenn),
            ObsoleteRibbon::SmartHoenn => Some(CobblemonRibbon::SmartHoenn),
            ObsoleteRibbon::SmartSuperHoenn => Some(CobblemonRibbon::SmartSuperHoenn),
            ObsoleteRibbon::SmartHyperHoenn => Some(CobblemonRibbon::SmartHyperHoenn),
            ObsoleteRibbon::SmartMasterHoenn => Some(CobblemonRibbon::SmartMasterHoenn),
            ObsoleteRibbon::ToughHoenn => Some(CobblemonRibbon::ToughHoenn),
            ObsoleteRibbon::ToughSuperHoenn => Some(CobblemonRibbon::ToughSuperHoenn),
            ObsoleteRibbon::ToughHyperHoenn => Some(CobblemonRibbon::ToughHyperHoenn),
            ObsoleteRibbon::ToughMasterHoenn => Some(CobblemonRibbon::ToughMasterHoenn),
            ObsoleteRibbon::CoolSinnoh => Some(CobblemonRibbon::CoolSinnoh),
            ObsoleteRibbon::CoolGreatSinnoh => Some(CobblemonRibbon::CoolGreatSinnoh),
            ObsoleteRibbon::CoolUltraSinnoh => Some(CobblemonRibbon::CoolUltraSinnoh),
            ObsoleteRibbon::CoolMasterSinnoh => Some(CobblemonRibbon::CoolMasterSinnoh),
            ObsoleteRibbon::BeautySinnoh => Some(CobblemonRibbon::BeautySinnoh),
            ObsoleteRibbon::BeautyGreatSinnoh => Some(CobblemonRibbon::BeautyGreatSinnoh),
            ObsoleteRibbon::BeautyUltraSinnoh => Some(CobblemonRibbon::BeautyUltraSinnoh),
            ObsoleteRibbon::BeautyMasterSinnoh => Some(CobblemonRibbon::BeautyMasterSinnoh),
            ObsoleteRibbon::CuteSinnoh => Some(CobblemonRibbon::CuteSinnoh),
            ObsoleteRibbon::CuteGreatSinnoh => Some(CobblemonRibbon::CuteGreatSinnoh),
            ObsoleteRibbon::CuteUltraSinnoh => Some(CobblemonRibbon::CuteUltraSinnoh),
            ObsoleteRibbon::CuteMasterSinnoh => Some(CobblemonRibbon::CuteMasterSinnoh),
            ObsoleteRibbon::SmartSinnoh => Some(CobblemonRibbon::SmartSinnoh),
            ObsoleteRibbon::SmartGreatSinnoh => Some(CobblemonRibbon::SmartGreatSinnoh),
            ObsoleteRibbon::SmartUltraSinnoh => Some(CobblemonRibbon::SmartUltraSinnoh),
            ObsoleteRibbon::SmartMasterSinnoh => Some(CobblemonRibbon::SmartMasterSinnoh),
            ObsoleteRibbon::ToughSinnoh => Some(CobblemonRibbon::ToughSinnoh),
            ObsoleteRibbon::ToughGreatSinnoh => Some(CobblemonRibbon::ToughGreatSinnoh),
            ObsoleteRibbon::ToughUltraSinnoh => Some(CobblemonRibbon::ToughUltraSinnoh),
            ObsoleteRibbon::ToughMasterSinnoh => Some(CobblemonRibbon::ToughMasterSinnoh),
        }
    }

    pub const fn from_openhome_if_present(openhome: OpenHomeRibbon) -> Option<Self> {
        match openhome {
            OpenHomeRibbon::Mod(modern) => Self::from_modern_if_present(modern),
            OpenHomeRibbon::Obs(obsolete) => Self::from_obsolete_if_present(obsolete),
        }
    }

    pub const fn to_openhome(self) -> Option<OpenHomeRibbon> {
        match self {
            // ModernRibbon
            CobblemonRibbon::KalosChampion => {
                Some(OpenHomeRibbon::Mod(ModernRibbon::KalosChampion))
            }
            CobblemonRibbon::Gen3Champion => Some(OpenHomeRibbon::Mod(ModernRibbon::Gen3Champion)),
            CobblemonRibbon::SinnohChampion => {
                Some(OpenHomeRibbon::Mod(ModernRibbon::SinnohChampion))
            }
            CobblemonRibbon::BestFriends => Some(OpenHomeRibbon::Mod(ModernRibbon::BestFriends)),
            CobblemonRibbon::Training => Some(OpenHomeRibbon::Mod(ModernRibbon::Training)),
            CobblemonRibbon::SkillfulBattler => {
                Some(OpenHomeRibbon::Mod(ModernRibbon::SkillfulBattler))
            }
            CobblemonRibbon::ExpertBattler => {
                Some(OpenHomeRibbon::Mod(ModernRibbon::ExpertBattler))
            }
            CobblemonRibbon::Effort => Some(OpenHomeRibbon::Mod(ModernRibbon::Effort)),
            CobblemonRibbon::Alert => Some(OpenHomeRibbon::Mod(ModernRibbon::Alert)),
            CobblemonRibbon::Shock => Some(OpenHomeRibbon::Mod(ModernRibbon::Shock)),
            CobblemonRibbon::Downcast => Some(OpenHomeRibbon::Mod(ModernRibbon::Downcast)),
            CobblemonRibbon::Careless => Some(OpenHomeRibbon::Mod(ModernRibbon::Careless)),
            CobblemonRibbon::Relax => Some(OpenHomeRibbon::Mod(ModernRibbon::Relax)),
            CobblemonRibbon::Snooze => Some(OpenHomeRibbon::Mod(ModernRibbon::Snooze)),
            CobblemonRibbon::Smile => Some(OpenHomeRibbon::Mod(ModernRibbon::Smile)),
            CobblemonRibbon::Gorgeous => Some(OpenHomeRibbon::Mod(ModernRibbon::Gorgeous)),
            CobblemonRibbon::Royal => Some(OpenHomeRibbon::Mod(ModernRibbon::Royal)),
            CobblemonRibbon::GorgeousRoyal => {
                Some(OpenHomeRibbon::Mod(ModernRibbon::GorgeousRoyal))
            }
            CobblemonRibbon::Artist => Some(OpenHomeRibbon::Mod(ModernRibbon::Artist)),
            CobblemonRibbon::Footprint => Some(OpenHomeRibbon::Mod(ModernRibbon::Footprint)),
            CobblemonRibbon::Record => Some(OpenHomeRibbon::Mod(ModernRibbon::Record)),
            CobblemonRibbon::Legend => Some(OpenHomeRibbon::Mod(ModernRibbon::Legend)),
            CobblemonRibbon::Country => Some(OpenHomeRibbon::Mod(ModernRibbon::Country)),
            CobblemonRibbon::National => Some(OpenHomeRibbon::Mod(ModernRibbon::National)),
            CobblemonRibbon::Earth => Some(OpenHomeRibbon::Mod(ModernRibbon::Earth)),
            CobblemonRibbon::World => Some(OpenHomeRibbon::Mod(ModernRibbon::World)),
            CobblemonRibbon::Classic => Some(OpenHomeRibbon::Mod(ModernRibbon::Classic)),
            CobblemonRibbon::Premier => Some(OpenHomeRibbon::Mod(ModernRibbon::Premier)),
            CobblemonRibbon::Event => Some(OpenHomeRibbon::Mod(ModernRibbon::Event)),
            CobblemonRibbon::Birthday => Some(OpenHomeRibbon::Mod(ModernRibbon::Birthday)),
            CobblemonRibbon::Special => Some(OpenHomeRibbon::Mod(ModernRibbon::Special)),
            CobblemonRibbon::Souvenir => Some(OpenHomeRibbon::Mod(ModernRibbon::Souvenir)),
            CobblemonRibbon::Wishing => Some(OpenHomeRibbon::Mod(ModernRibbon::Wishing)),
            CobblemonRibbon::BattleChampion => {
                Some(OpenHomeRibbon::Mod(ModernRibbon::BattleChampion))
            }
            CobblemonRibbon::RegionalChampion => {
                Some(OpenHomeRibbon::Mod(ModernRibbon::RegionalChampion))
            }
            CobblemonRibbon::NationalChampion => {
                Some(OpenHomeRibbon::Mod(ModernRibbon::NationalChampion))
            }
            CobblemonRibbon::WorldChampion => {
                Some(OpenHomeRibbon::Mod(ModernRibbon::WorldChampion))
            }
            CobblemonRibbon::ContestMemory => {
                Some(OpenHomeRibbon::Mod(ModernRibbon::ContestMemory))
            }
            CobblemonRibbon::BattleMemory => Some(OpenHomeRibbon::Mod(ModernRibbon::BattleMemory)),
            CobblemonRibbon::HoennChampion => {
                Some(OpenHomeRibbon::Mod(ModernRibbon::HoennChampion))
            }
            CobblemonRibbon::ContestStar => Some(OpenHomeRibbon::Mod(ModernRibbon::ContestStar)),
            CobblemonRibbon::CoolnessMaster => {
                Some(OpenHomeRibbon::Mod(ModernRibbon::CoolnessMaster))
            }
            CobblemonRibbon::BeautyMaster => Some(OpenHomeRibbon::Mod(ModernRibbon::BeautyMaster)),
            CobblemonRibbon::CutenessMaster => {
                Some(OpenHomeRibbon::Mod(ModernRibbon::CutenessMaster))
            }
            CobblemonRibbon::ClevernessMaster => {
                Some(OpenHomeRibbon::Mod(ModernRibbon::ClevernessMaster))
            }
            CobblemonRibbon::ToughnessMaster => {
                Some(OpenHomeRibbon::Mod(ModernRibbon::ToughnessMaster))
            }
            CobblemonRibbon::AlolaChampion => {
                Some(OpenHomeRibbon::Mod(ModernRibbon::AlolaChampion))
            }
            CobblemonRibbon::BattleRoyalChampion => {
                Some(OpenHomeRibbon::Mod(ModernRibbon::BattleRoyalChampion))
            }
            CobblemonRibbon::BattleTreeGreat => {
                Some(OpenHomeRibbon::Mod(ModernRibbon::BattleTreeGreat))
            }
            CobblemonRibbon::BattleTreeMaster => {
                Some(OpenHomeRibbon::Mod(ModernRibbon::BattleTreeMaster))
            }
            CobblemonRibbon::GalarChampion => {
                Some(OpenHomeRibbon::Mod(ModernRibbon::GalarChampion))
            }
            CobblemonRibbon::TowerMaster => Some(OpenHomeRibbon::Mod(ModernRibbon::TowerMaster)),
            CobblemonRibbon::MasterRank => Some(OpenHomeRibbon::Mod(ModernRibbon::MasterRank)),
            CobblemonRibbon::LunchtimeMark => {
                Some(OpenHomeRibbon::Mod(ModernRibbon::LunchtimeMark))
            }
            CobblemonRibbon::SleepyTimeMark => {
                Some(OpenHomeRibbon::Mod(ModernRibbon::SleepyTimeMark))
            }
            CobblemonRibbon::DuskMark => Some(OpenHomeRibbon::Mod(ModernRibbon::DuskMark)),
            CobblemonRibbon::DawnMark => Some(OpenHomeRibbon::Mod(ModernRibbon::DawnMark)),
            CobblemonRibbon::CloudyMark => Some(OpenHomeRibbon::Mod(ModernRibbon::CloudyMark)),
            CobblemonRibbon::RainyMark => Some(OpenHomeRibbon::Mod(ModernRibbon::RainyMark)),
            CobblemonRibbon::StormyMark => Some(OpenHomeRibbon::Mod(ModernRibbon::StormyMark)),
            CobblemonRibbon::SnowyMark => Some(OpenHomeRibbon::Mod(ModernRibbon::SnowyMark)),
            CobblemonRibbon::BlizzardMark => Some(OpenHomeRibbon::Mod(ModernRibbon::BlizzardMark)),
            CobblemonRibbon::DryMark => Some(OpenHomeRibbon::Mod(ModernRibbon::DryMark)),
            CobblemonRibbon::SandstormMark => {
                Some(OpenHomeRibbon::Mod(ModernRibbon::SandstormMark))
            }
            CobblemonRibbon::MistyMark => Some(OpenHomeRibbon::Mod(ModernRibbon::MistyMark)),
            CobblemonRibbon::DestinyMark => Some(OpenHomeRibbon::Mod(ModernRibbon::DestinyMark)),
            CobblemonRibbon::FishingMark => Some(OpenHomeRibbon::Mod(ModernRibbon::FishingMark)),
            CobblemonRibbon::CurryMark => Some(OpenHomeRibbon::Mod(ModernRibbon::CurryMark)),
            CobblemonRibbon::UncommonMark => Some(OpenHomeRibbon::Mod(ModernRibbon::UncommonMark)),
            CobblemonRibbon::RareMark => Some(OpenHomeRibbon::Mod(ModernRibbon::RareMark)),
            CobblemonRibbon::RowdyMark => Some(OpenHomeRibbon::Mod(ModernRibbon::RowdyMark)),
            CobblemonRibbon::AbsentMindedMark => {
                Some(OpenHomeRibbon::Mod(ModernRibbon::AbsentMindedMark))
            }
            CobblemonRibbon::JitteryMark => Some(OpenHomeRibbon::Mod(ModernRibbon::JitteryMark)),
            CobblemonRibbon::ExcitedMark => Some(OpenHomeRibbon::Mod(ModernRibbon::ExcitedMark)),
            CobblemonRibbon::CharismaticMark => {
                Some(OpenHomeRibbon::Mod(ModernRibbon::CharismaticMark))
            }
            CobblemonRibbon::CalmnessMark => Some(OpenHomeRibbon::Mod(ModernRibbon::CalmnessMark)),
            CobblemonRibbon::IntenseMark => Some(OpenHomeRibbon::Mod(ModernRibbon::IntenseMark)),
            CobblemonRibbon::ZonedOutMark => Some(OpenHomeRibbon::Mod(ModernRibbon::ZonedOutMark)),
            CobblemonRibbon::JoyfulMark => Some(OpenHomeRibbon::Mod(ModernRibbon::JoyfulMark)),
            CobblemonRibbon::AngryMark => Some(OpenHomeRibbon::Mod(ModernRibbon::AngryMark)),
            CobblemonRibbon::SmileyMark => Some(OpenHomeRibbon::Mod(ModernRibbon::SmileyMark)),
            CobblemonRibbon::TearyMark => Some(OpenHomeRibbon::Mod(ModernRibbon::TearyMark)),
            CobblemonRibbon::UpbeatMark => Some(OpenHomeRibbon::Mod(ModernRibbon::UpbeatMark)),
            CobblemonRibbon::PeevedMark => Some(OpenHomeRibbon::Mod(ModernRibbon::PeevedMark)),
            CobblemonRibbon::IntellectualMark => {
                Some(OpenHomeRibbon::Mod(ModernRibbon::IntellectualMark))
            }
            CobblemonRibbon::FerociousMark => {
                Some(OpenHomeRibbon::Mod(ModernRibbon::FerociousMark))
            }
            CobblemonRibbon::CraftyMark => Some(OpenHomeRibbon::Mod(ModernRibbon::CraftyMark)),
            CobblemonRibbon::ScowlingMark => Some(OpenHomeRibbon::Mod(ModernRibbon::ScowlingMark)),
            CobblemonRibbon::KindlyMark => Some(OpenHomeRibbon::Mod(ModernRibbon::KindlyMark)),
            CobblemonRibbon::FlusteredMark => {
                Some(OpenHomeRibbon::Mod(ModernRibbon::FlusteredMark))
            }
            CobblemonRibbon::PumpedUpMark => Some(OpenHomeRibbon::Mod(ModernRibbon::PumpedUpMark)),
            CobblemonRibbon::ZeroEnergyMark => {
                Some(OpenHomeRibbon::Mod(ModernRibbon::ZeroEnergyMark))
            }
            CobblemonRibbon::PridefulMark => Some(OpenHomeRibbon::Mod(ModernRibbon::PridefulMark)),
            CobblemonRibbon::UnsureMark => Some(OpenHomeRibbon::Mod(ModernRibbon::UnsureMark)),
            CobblemonRibbon::HumbleMark => Some(OpenHomeRibbon::Mod(ModernRibbon::HumbleMark)),
            CobblemonRibbon::ThornyMark => Some(OpenHomeRibbon::Mod(ModernRibbon::ThornyMark)),
            CobblemonRibbon::VigorMark => Some(OpenHomeRibbon::Mod(ModernRibbon::VigorMark)),
            CobblemonRibbon::SlumpMark => Some(OpenHomeRibbon::Mod(ModernRibbon::SlumpMark)),
            CobblemonRibbon::Hisui => Some(OpenHomeRibbon::Mod(ModernRibbon::Hisui)),
            CobblemonRibbon::TwinklingStar => {
                Some(OpenHomeRibbon::Mod(ModernRibbon::TwinklingStar))
            }
            CobblemonRibbon::PaldeaChampion => {
                Some(OpenHomeRibbon::Mod(ModernRibbon::PaldeaChampion))
            }
            CobblemonRibbon::JumboMark => Some(OpenHomeRibbon::Mod(ModernRibbon::JumboMark)),
            CobblemonRibbon::MiniMark => Some(OpenHomeRibbon::Mod(ModernRibbon::MiniMark)),
            CobblemonRibbon::ItemfinderMark => {
                Some(OpenHomeRibbon::Mod(ModernRibbon::ItemfinderMark))
            }
            CobblemonRibbon::PartnerMark => Some(OpenHomeRibbon::Mod(ModernRibbon::PartnerMark)),
            CobblemonRibbon::GourmandMark => Some(OpenHomeRibbon::Mod(ModernRibbon::GourmandMark)),
            CobblemonRibbon::OnceInALifetime => {
                Some(OpenHomeRibbon::Mod(ModernRibbon::OnceInALifetime))
            }
            CobblemonRibbon::AlphaMark => Some(OpenHomeRibbon::Mod(ModernRibbon::AlphaMark)),
            CobblemonRibbon::MightiestMark => {
                Some(OpenHomeRibbon::Mod(ModernRibbon::MightiestMark))
            }
            CobblemonRibbon::TitanMark => Some(OpenHomeRibbon::Mod(ModernRibbon::TitanMark)),
            CobblemonRibbon::Partner => Some(OpenHomeRibbon::Mod(ModernRibbon::Partner)),
            // ObsoleteRibbon
            CobblemonRibbon::Winning => Some(OpenHomeRibbon::Obs(ObsoleteRibbon::Winning)),
            CobblemonRibbon::Victory => Some(OpenHomeRibbon::Obs(ObsoleteRibbon::Victory)),
            CobblemonRibbon::Ability => Some(OpenHomeRibbon::Obs(ObsoleteRibbon::Ability)),
            CobblemonRibbon::GreatAbility => {
                Some(OpenHomeRibbon::Obs(ObsoleteRibbon::GreatAbility))
            }
            CobblemonRibbon::DoubleAbility => {
                Some(OpenHomeRibbon::Obs(ObsoleteRibbon::DoubleAbility))
            }
            CobblemonRibbon::MultiAbility => {
                Some(OpenHomeRibbon::Obs(ObsoleteRibbon::MultiAbility))
            }
            CobblemonRibbon::PairAbility => Some(OpenHomeRibbon::Obs(ObsoleteRibbon::PairAbility)),
            CobblemonRibbon::WorldAbility => {
                Some(OpenHomeRibbon::Obs(ObsoleteRibbon::WorldAbility))
            }
            CobblemonRibbon::CoolHoenn => Some(OpenHomeRibbon::Obs(ObsoleteRibbon::CoolHoenn)),
            CobblemonRibbon::CoolSuperHoenn => {
                Some(OpenHomeRibbon::Obs(ObsoleteRibbon::CoolSuperHoenn))
            }
            CobblemonRibbon::CoolHyperHoenn => {
                Some(OpenHomeRibbon::Obs(ObsoleteRibbon::CoolHyperHoenn))
            }
            CobblemonRibbon::CoolMasterHoenn => {
                Some(OpenHomeRibbon::Obs(ObsoleteRibbon::CoolMasterHoenn))
            }
            CobblemonRibbon::BeautyHoenn => Some(OpenHomeRibbon::Obs(ObsoleteRibbon::BeautyHoenn)),
            CobblemonRibbon::BeautySuperHoenn => {
                Some(OpenHomeRibbon::Obs(ObsoleteRibbon::BeautySuperHoenn))
            }
            CobblemonRibbon::BeautyHyperHoenn => {
                Some(OpenHomeRibbon::Obs(ObsoleteRibbon::BeautyHyperHoenn))
            }
            CobblemonRibbon::BeautyMasterHoenn => {
                Some(OpenHomeRibbon::Obs(ObsoleteRibbon::BeautyMasterHoenn))
            }
            CobblemonRibbon::CuteHoenn => Some(OpenHomeRibbon::Obs(ObsoleteRibbon::CuteHoenn)),
            CobblemonRibbon::CuteSuperHoenn => {
                Some(OpenHomeRibbon::Obs(ObsoleteRibbon::CuteSuperHoenn))
            }
            CobblemonRibbon::CuteHyperHoenn => {
                Some(OpenHomeRibbon::Obs(ObsoleteRibbon::CuteHyperHoenn))
            }
            CobblemonRibbon::CuteMasterHoenn => {
                Some(OpenHomeRibbon::Obs(ObsoleteRibbon::CuteMasterHoenn))
            }
            CobblemonRibbon::SmartHoenn => Some(OpenHomeRibbon::Obs(ObsoleteRibbon::SmartHoenn)),
            CobblemonRibbon::SmartSuperHoenn => {
                Some(OpenHomeRibbon::Obs(ObsoleteRibbon::SmartSuperHoenn))
            }
            CobblemonRibbon::SmartHyperHoenn => {
                Some(OpenHomeRibbon::Obs(ObsoleteRibbon::SmartHyperHoenn))
            }
            CobblemonRibbon::SmartMasterHoenn => {
                Some(OpenHomeRibbon::Obs(ObsoleteRibbon::SmartMasterHoenn))
            }
            CobblemonRibbon::ToughHoenn => Some(OpenHomeRibbon::Obs(ObsoleteRibbon::ToughHoenn)),
            CobblemonRibbon::ToughSuperHoenn => {
                Some(OpenHomeRibbon::Obs(ObsoleteRibbon::ToughSuperHoenn))
            }
            CobblemonRibbon::ToughHyperHoenn => {
                Some(OpenHomeRibbon::Obs(ObsoleteRibbon::ToughHyperHoenn))
            }
            CobblemonRibbon::ToughMasterHoenn => {
                Some(OpenHomeRibbon::Obs(ObsoleteRibbon::ToughMasterHoenn))
            }
            CobblemonRibbon::CoolSinnoh => Some(OpenHomeRibbon::Obs(ObsoleteRibbon::CoolSinnoh)),
            CobblemonRibbon::CoolGreatSinnoh => {
                Some(OpenHomeRibbon::Obs(ObsoleteRibbon::CoolGreatSinnoh))
            }
            CobblemonRibbon::CoolUltraSinnoh => {
                Some(OpenHomeRibbon::Obs(ObsoleteRibbon::CoolUltraSinnoh))
            }
            CobblemonRibbon::CoolMasterSinnoh => {
                Some(OpenHomeRibbon::Obs(ObsoleteRibbon::CoolMasterSinnoh))
            }
            CobblemonRibbon::BeautySinnoh => {
                Some(OpenHomeRibbon::Obs(ObsoleteRibbon::BeautySinnoh))
            }
            CobblemonRibbon::BeautyGreatSinnoh => {
                Some(OpenHomeRibbon::Obs(ObsoleteRibbon::BeautyGreatSinnoh))
            }
            CobblemonRibbon::BeautyUltraSinnoh => {
                Some(OpenHomeRibbon::Obs(ObsoleteRibbon::BeautyUltraSinnoh))
            }
            CobblemonRibbon::BeautyMasterSinnoh => {
                Some(OpenHomeRibbon::Obs(ObsoleteRibbon::BeautyMasterSinnoh))
            }
            CobblemonRibbon::CuteSinnoh => Some(OpenHomeRibbon::Obs(ObsoleteRibbon::CuteSinnoh)),
            CobblemonRibbon::CuteGreatSinnoh => {
                Some(OpenHomeRibbon::Obs(ObsoleteRibbon::CuteGreatSinnoh))
            }
            CobblemonRibbon::CuteUltraSinnoh => {
                Some(OpenHomeRibbon::Obs(ObsoleteRibbon::CuteUltraSinnoh))
            }
            CobblemonRibbon::CuteMasterSinnoh => {
                Some(OpenHomeRibbon::Obs(ObsoleteRibbon::CuteMasterSinnoh))
            }
            CobblemonRibbon::SmartSinnoh => Some(OpenHomeRibbon::Obs(ObsoleteRibbon::SmartSinnoh)),
            CobblemonRibbon::SmartGreatSinnoh => {
                Some(OpenHomeRibbon::Obs(ObsoleteRibbon::SmartGreatSinnoh))
            }
            CobblemonRibbon::SmartUltraSinnoh => {
                Some(OpenHomeRibbon::Obs(ObsoleteRibbon::SmartUltraSinnoh))
            }
            CobblemonRibbon::SmartMasterSinnoh => {
                Some(OpenHomeRibbon::Obs(ObsoleteRibbon::SmartMasterSinnoh))
            }
            CobblemonRibbon::ToughSinnoh => Some(OpenHomeRibbon::Obs(ObsoleteRibbon::ToughSinnoh)),
            CobblemonRibbon::ToughGreatSinnoh => {
                Some(OpenHomeRibbon::Obs(ObsoleteRibbon::ToughGreatSinnoh))
            }
            CobblemonRibbon::ToughUltraSinnoh => {
                Some(OpenHomeRibbon::Obs(ObsoleteRibbon::ToughUltraSinnoh))
            }
            CobblemonRibbon::ToughMasterSinnoh => {
                Some(OpenHomeRibbon::Obs(ObsoleteRibbon::ToughMasterSinnoh))
            }
            _ => None,
        }
    }
}

impl From<usize> for CobblemonRibbon {
    fn from(value: usize) -> Self {
        Self::from_index(value).expect("Ribbon index is valid")
    }
}

impl From<ModernRibbon> for CobblemonRibbon {
    fn from(modern: ModernRibbon) -> Self {
        Self::from_modern_if_present(modern).expect("ModernRibbon maps to CobblemonRibbon")
    }
}

impl From<ObsoleteRibbon> for CobblemonRibbon {
    fn from(obsolete: ObsoleteRibbon) -> Self {
        Self::from_obsolete_if_present(obsolete).expect("ObsoleteRibbon maps to CobblemonRibbon")
    }
}

impl From<OpenHomeRibbon> for CobblemonRibbon {
    fn from(openhome: OpenHomeRibbon) -> Self {
        Self::from_openhome_if_present(openhome).expect("OpenHomeRibbon maps to CobblemonRibbon")
    }
}

impl From<CobblemonRibbon> for &str {
    fn from(ribbon: CobblemonRibbon) -> Self {
        CobblemonRibbon::to_cobblemon_resource_id(ribbon).expect("Ribbon index is valid")
    }
}

impl From<CobblemonRibbon> for usize {
    fn from(ribbon: CobblemonRibbon) -> Self {
        ribbon.get_index()
    }
}

impl Display for CobblemonRibbon {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(self.name())
    }
}

impl Ribbon for CobblemonRibbon {
    const MAX: usize = ModernRibbon::Partner as usize;
}
