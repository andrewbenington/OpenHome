using PKHeX.Core;
using System;
using System.Linq;

public static class PkhCoreDataObject
{

    public static object Build(GameDataCore core)
    {
        var languageCode = Language.GetLanguageCode(LanguageID.English);
        var strings = GameInfo.GetStrings(languageCode);
        return new
        {
            home_tracker = core.Tracker > 0 ? (object)core.Tracker : null,
            encryption_constant = core.EncryptionConstant,
            is_bad_egg = core.IsBadEgg,
            species_and_form = Util.SpeciesForm(core),
            held_item_index = core.HeldItem,
            trainer_id = core.TID16,
            secret_id = core.SID16,
            exp = core.EXP,
            is_favorite = core.IsFavorite,
            markings = Util.MarkingsSixShapesColors(core),
            personality_value = core.PID,
            nature = core.Nature.ToString(),
            is_fateful_encounter = core.FatefulEncounter,
            gender = Util.FormatGender(core.Gender),
            evs = Util.EVs(core),
            contest = Util.ContestStats(core),
            ribbons = Util.GetRibbonNames(core),
            contest_memory_count = core.RibbonCountMemoryContest,
            battle_memory_count = core.RibbonCountMemoryBattle,
            form_argument = core.FormArgument,
            nickname = core.Nickname,
            nickname_trash = System.Convert.ToHexString(core.NicknameTrash),
            ivs = Util.IVs(core),
            is_egg = core.IsEgg,
            is_nicknamed = core.IsNicknamed,
            handler_name = core.HandlingTrainerName,
            handler_gender = Util.FormatGender(core.HandlingTrainerGender),
            is_current_handler = core.CurrentHandler == 1,
            handler_friendship = core.HandlingTrainerFriendship,
            handler_memory = Util.HandlerMemoryData(core),
            handler_id = core.HandlingTrainerID,
            handler_language = Util.FormatLanguageName(core.HandlingTrainerLanguage),
            trainer_name = core.OriginalTrainerName,
            trainer_friendship = core.OriginalTrainerFriendship,
            trainer_memory = Util.TrainerMemoryData(core),
            egg_date = Util.NullableDateStrFromParts(core.EggYear, core.EggMonth, core.EggDay),
            met_date = Util.NullableDateStrFromParts(core.MetYear, core.MetMonth, core.MetDay),
            // egg_location_index = core.EggLocation,
            // met_location_index = core.MetLocation,
            // ball = Util.FormatBall(core, strings),
            met_level = core.MetLevel,
            trainer_gender = Util.FormatGender(core.OriginalTrainerGender),
            hyper_training = Util.HyperTrainingData(core),
            game_of_origin = Util.FormatGame(core.Version, strings),
            game_of_origin_battle = core.BattleVersion == 0 ? null : Util.FormatGame(core.BattleVersion, strings),
            language = Util.FormatLanguageName(core.Language),
            status_condition = core.Status_Condition,
            // stat_level = core.Stat_Level,
            // stats = Util.Stats(core),
            // level = core.CurrentLevel,
            affixed_ribbon = Util.FormatAffixedRibbon(core.AffixedRibbon, strings),
            height_scalar = core.HeightScalar,
            weight_scalar = core.WeightScalar,
            // scale = core.Scale,
            mint_nature = core.StatAlignment.ToString(),
            // tera_type_original = Util.FormatTeraType(core.TeraTypeOriginal),
            // tera_type_override = Util.FormatTeraType(core.TeraTypeOverride),
            // tm_flags_base_game = core.RecordFlagsBase.ToArray().ToList(),
            // tm_flags_dlc = core.RecordFlagsDLC.ToArray().ToList(),
            current_hp = core.Stat_HPCurrent,
            // obedience_level = core.ObedienceLevel
        };
    }
}
