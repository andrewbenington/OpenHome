using System;
using System.Linq;
using PKHeX.Core;

public static class ColopkmObject
{

    public static object Build(CK3 pk)
    {
        pk.ResetPartyStats();
        var languageCode = Language.GetLanguageCode((LanguageID)pk.Language);
        var strings = GameInfo.GetStrings(languageCode);
        String nil = null;
        return new
        {
            pokemon_index = pk.SpeciesInternal,
            held_item_index = pk.HeldItem == 0 ? null : (object)pk.HeldItem,
            trainer_id = pk.TID16,
            secret_id = pk.SID16,
            exp = pk.EXP,
            ability_num = Util.FormatAbilityNum(pk.AbilityNumber),
            markings = Util.MarkingsFourShapes(pk),
            personality_value = pk.PID,
            is_fateful_encounter = pk.FatefulEncounter,
            gender = Util.FormatGender(pk.Gender),
            evs = Util.EVs(pk),
            contest = Util.ContestStats(pk),
            pokerus = Util.Pokerus(pk.PokerusStrain, pk.PokerusDays),
            ribbons = Util.GetRibbons(pk).ToList().Select(s => s.Replace(" Ribbon", "")).ToArray(),
            nickname = pk.Nickname,
            nickname_trash = System.Convert.ToHexString(pk.NicknameTrash),
            moves = Util.AllMoveData(pk, strings),
            ivs = Util.IVs(pk),
            is_egg = pk.IsEgg,
            trainer_name = pk.OriginalTrainerName,
            trainer_name_trash = System.Convert.ToHexString(pk.OriginalTrainerTrash),
            trainer_friendship = pk.OriginalTrainerFriendship,
            shadow_data = Util.ShadowData(pk),
            current_region = Util.GcnRegion(pk.CurrentRegion),
            original_region = Util.GcnRegion(pk.OriginalRegion),
            met_location_index = pk.MetLocation,
            ball = Util.FormatBall(pk, strings),
            met_level = pk.MetLevel,
            trainer_gender = Util.FormatGender(pk.OriginalTrainerGender),
            game_of_origin = strings.gamelist.GetValue((int)pk.Version),
            language = Util.FormatLanguageName(pk.Language),
            stat_level = pk.Stat_Level,
            current_hp = pk.Stat_HPCurrent,
            stats = Util.Stats(pk),
            level = pk.CurrentLevel
        };
    }
}
