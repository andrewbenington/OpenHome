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
            encryption_seed = pk.EncryptionSeed,
            game_data_size = pk.GameDataSize,
            encoded_data_size = pk.EncodedDataSize,
            data_version = pk.DataVersion,
            checksum = pk.Checksum,
            core_data_size = pk.CoreDataSize,

            core_data = PkhCoreDataObject.Build(pk.Core),

            pa8_data = PkhPa8Object.Build(pk.DataPA8)
        };
    }
}
