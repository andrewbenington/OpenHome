using PKHeX.Core;
using System;
using System.Linq;

public static class PkhPb8Object
{

    public static object Build(GameDataPB8 pk)
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
            tr_flags_swsh = Util.GetFlagIndexes(64, pk.GetMoveRecordFlag),
            egg_location_index = pk.EggLocation,
            met_location_index = pk.MetLocation,
            ball = Util.FormatBall(pk, strings),
            pokerus = pk.PokerusState,
        };
    }
}
