using PKHeX.Core;
using System;
using System.Linq;

public static class PkhPc9Object
{

    public static object Build(GameDataPC9 pk)
    {
        if (pk == null) {
            return null;
        }
        
        return new
        {
            transfer_state = pk.State.ToString(),
            timestamp_unix_seconds = pk.Timestamp,
            tag = pk.Tag,
        };
    }
}
