using PKHeX.Core;
using System;
using System.Linq;

public static class PkhPa9Object
{
    const int FIRST_PLUS_FLAG_BLOCK_B_INDEX = 264;
    const int TOTAL_PLUS_FLAG_BYTES = 45;
    public static object Build(GameDataPA9 pk)
    {
        if (pk == null)
        {
            return null;
        }

        var languageCode = Language.GetLanguageCode(LanguageID.English);
        var strings = GameInfo.GetStrings(languageCode);
        return new
        {
            ability_index = strings.abilitylist.GetValue(pk.Ability),
            ability_num = Util.FormatAbilityNum(pk.AbilityNumber),
            moves = Util.AllMoveNames(pk, strings),
            egg_location_index = pk.EggLocation,
            met_location_index = pk.MetLocation,
            ball = Util.FormatBall(pk, strings),
            scale = pk.Scale,
            obedience_level = pk.Obedience_Level,
            plus_moves_c = Util.GetFlagIndexes(TOTAL_PLUS_FLAG_BYTES, pk.GetMovePlusFlag),
            plus_moves_b = Util.GetFlagIndexes(TOTAL_PLUS_FLAG_BYTES, pk.GetMovePlusFlag),
            is_alpha = pk.IsAlpha,
        };
    }
}
