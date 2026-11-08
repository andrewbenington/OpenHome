using PKHeX.Core;
using System;
using System.Linq;

public static class PkhPa8Object
{

    public static object Build(GameDataPA8 pk)
    {
        if (pk == null) {
            return null;
        }
        
        var languageCode = Language.GetLanguageCode(LanguageID.English);
        var strings = GameInfo.GetStrings(languageCode);
        return new
        {
            ability_index = strings.abilitylist.GetValue(pk.Ability),
            ability_num = Util.FormatAbilityNum(pk.AbilityNumber),
            moves = Util.AllMoveData(pk, strings),
            relearn_moves = Util.RelearnMoves(pk, strings),
            is_alpha = pk.IsAlpha,
            is_noble = pk.IsNoble,
            alpha_move = Util.FormatMoveName(pk.AlphaMove, strings),
            scale = pk.Scale,
            height_absolute = Util.FormatFloat(pk.HeightAbsolute),
            weight_absolute = Util.FormatFloat(pk.WeightAbsolute),
            egg_location_index = pk.EggLocation,
            met_location_index = pk.MetLocation,
            ball = Util.FormatBall(pk, strings),
            pokerus = pk.PokerusState,
            gvs = Util.GVs(pk),
            tutor_flags_la = Util.GetFlagIndexes(64, pk.GetPurchasedRecordFlag),
            master_flags_la = Util.GetFlagIndexes(64, pk.GetMasteredRecordFlag),
        };
    }
}
