using PKHeX.Core;
using System;
using System.Linq;

public static class Pk8Object
{

    public static object Build(PK8 pk)
    {
        pk.ResetPartyStats();
        var languageCode = Language.GetLanguageCode((LanguageID)pk.Language);
        var strings = GameInfo.GetStrings(languageCode);
        return new
        {
            encryption_constant = pk.EncryptionConstant,
            sanity = 0,
            checksum = pk.Checksum,
            species_and_form = Util.SpeciesAndForm(pk),
            held_item_index = pk.HeldItem,
            trainer_id = pk.TID16,
            secret_id = pk.SID16,
            exp = pk.EXP,
            ability_index = strings.abilitylist.GetValue(pk.Ability),
            ability_num = Util.FormatAbilityNum(pk.AbilityNumber),
            markings = Util.MarkingsSixShapesColors(pk),
            personality_value = pk.PID,
            nature = pk.Nature.ToString(),
            is_fateful_encounter = pk.FatefulEncounter,
            gender = Util.FormatGender(pk.Gender),
            evs = Util.EVs(pk),
            contest = Util.ContestStats(pk),
            pokerus_byte = pk.PokerusState,
            ribbons = Util.GetRibbons(pk),
            contest_memory_count = pk.RibbonCountMemoryContest,
            battle_memory_count = pk.RibbonCountMemoryBattle,
            form_argument = pk.FormArgument,
            nickname = pk.Nickname,
            nickname_trash = System.Convert.ToHexString(pk.NicknameTrash),
            moves = Util.AllMoveData(pk, strings),
            relearn_moves = Util.RelearnMoves(pk, strings),
            ivs = Util.IVs(pk),
            is_egg = pk.IsEgg,
            is_nicknamed = pk.IsNicknamed,
            handler_name = pk.HandlingTrainerName,
            handler_gender = Util.FormatGender(pk.HandlingTrainerGender),
            is_current_handler = pk.CurrentHandler == 1,
            handler_friendship = pk.HandlingTrainerFriendship,
            handler_memory = Util.HandlerMemoryData(pk),
            handler_id = pk.HandlingTrainerID,
            handler_language = Util.FormatLanguageName(pk.HandlingTrainerLanguage),
            fullness = pk.Fullness,
            enjoyment = pk.Enjoyment,
            trainer_name = pk.OriginalTrainerName,
            trainer_friendship = pk.OriginalTrainerFriendship,
            trainer_memory = Util.TrainerMemoryData(pk),
            egg_date = pk.EggMetDate != null ? pk.EggMetDate.ToString() : null,
            met_date = pk.MetDate.ToString(),
            egg_location_index = pk.EggLocation,
            met_location_index = pk.MetLocation,
            ball = Util.FormatBall(pk, strings),
            met_level = pk.MetLevel,
            trainer_gender = Util.FormatGender(pk.OriginalTrainerGender),
            hyper_training = Util.HyperTrainingData(pk),
            game_of_origin = strings.gamelist.GetValue((int)pk.Version),
            game_of_origin_battle = pk.BattleVersion == 0 ? null : strings.gamelist.GetValue((int)pk.BattleVersion),
            language = Util.FormatLanguageName(pk.Language),
            status_condition = pk.Status_Condition,
            stat_level = pk.Stat_Level,
            stats = Util.Stats(pk),
            level = pk.CurrentLevel,
            palma = pk.Palma,
            affixed_ribbon = Util.FormatAffixedRibbon(pk.AffixedRibbon, strings),
            height_scalar = pk.HeightScalar,
            weight_scalar = pk.WeightScalar,
            mint_nature = pk.StatNature.ToString(),
            dynamax_level = pk.DynamaxLevel,
            is_favorite = pk.IsFavorite,
            sociability = pk.Sociability,
            home_tracker = pk.Tracker > 0 ? (object)pk.Tracker : null,
            tr_flags_swsh = pk.RecordFlags.ToArray().ToList(),
            can_gigantamax = pk.CanGigantamax,
            current_hp = pk.Stat_HPCurrent
        };
    }
}
