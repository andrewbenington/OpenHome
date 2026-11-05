using PKHeX.Core;
using System;
using System.Linq;

public static class PkhObject
{

    public static object Build(PKH pk)
    {
        var languageCode = Language.GetLanguageCode(LanguageID.English);
        var strings = GameInfo.GetStrings(languageCode);
        return new
        {
            pa8 = PkhPa8Object.Build(pk.DataPA8)
        };
    }
}
