using PKHeX.Core;
using System;
using System.Linq;

public static class PkhPb7Object
{

    public static object Build(GameDataPB7 pk)
    {
        if (pk == null)
        {
            return null;
        }

        var languageCode = Language.GetLanguageCode(LanguageID.English);
        var strings = GameInfo.GetStrings(languageCode);
        return new
        {
            avs = Util.AVs(pk),
            resort_event_status = pk.ResortEventState,
            moves = Util.AllMoveData(pk, strings),
            relearn_moves = Util.RelearnMoves(pk, strings),
            height_absolute = pk.HeightAbsolute,
            weight_absolute = pk.WeightAbsolute,
            spirit = pk.Spirit,
            mood = pk.Mood,
            fullness = pk.Fullness,
            rank = pk.Rank,
            received_year = pk.ReceivedYear,
            received_month = pk.ReceivedMonth,
            received_day = pk.ReceivedDay,
            received_hour = pk.ReceivedHour,
            received_minute = pk.ReceivedMinute,
            received_second = pk.ReceivedSecond,
            enjoyment = pk.Enjoyment,
            geo_padding = pk.GeoPadding,
            ball = pk.Ball,
            egg_location = pk.EggLocation,
            met_location = pk.MetLocation,
            pokerus = pk.PokerusState,
            ability_index = pk.Ability,
            ability_num = pk.AbilityNumber,
        };
    }
}
