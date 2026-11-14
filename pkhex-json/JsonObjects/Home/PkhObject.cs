using PKHeX.Core;
using System;
using System.Linq;

public static class PkhObject
{

    public static object Build(PKH pk)
    {
        return new
        {
            encryption_seed = pk.EncryptionSeed,
            game_data_size = pk.GameDataSize,
            encoded_data_size = pk.EncodedDataSize,
            data_version = pk.DataVersion,
            checksum = pk.Checksum,
            core_data_size = pk.CoreDataSize,

            core_data = PkhCoreDataObject.Build(pk.Core),

            pb7_data = PkhPb7Object.Build(pk.DataPB7),
            pk8_data = PkhPk8Object.Build(pk.DataPK8),
            pb8_data = PkhPb8Object.Build(pk.DataPB8),
            pa8_data = PkhPa8Object.Build(pk.DataPA8),
            pk9_data = PkhPk9Object.Build(pk.DataPK9),
            pa9_data = PkhPa9Object.Build(pk.DataPA9),
            pc9_data = PkhPc9Object.Build(pk.DataPC9)
        };
    }
}
