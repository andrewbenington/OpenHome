using PKHeX.Core;
using System;
using System.Linq;

public static class PkhPk9Object
{

    const int FIRST_DLC_TM_INDEX = 200;
    const int TOTAL_TM_FLAG_BYTES = 38;
    
    public static object Build(GameDataPK9 pk)
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
            egg_location_index = pk.EggLocation,
            met_location_index = pk.MetLocation,
            ball = Util.FormatBall(pk, strings),
            tera_type_original = Util.FormatTeraType(pk.TeraTypeOriginal),
            tera_type_override = Util.FormatTeraType(pk.TeraTypeOverride),
            scale = pk.Scale,
            obedience_level = pk.Obedience_Level,
            tm_flags_base_game = Util.GetFlagIndexes(TOTAL_TM_FLAG_BYTES, index => index < FIRST_DLC_TM_INDEX && pk.GetMoveRecordFlag(index)),
            tm_flags_dlc = Util.GetFlagIndexes(TOTAL_TM_FLAG_BYTES, index => index >= FIRST_DLC_TM_INDEX && pk.GetMoveRecordFlag(index)),
        };
    }
}
