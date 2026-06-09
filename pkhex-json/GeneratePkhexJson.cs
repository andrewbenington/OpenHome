using PKHeX.Core;
using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;


var baseDir = AppContext.BaseDirectory;
var pkmFileDirs = Directory.EnumerateDirectories(Path.Join("test-files", "pkm-files"));

var pkmClassByDir = new Dictionary<string, Func<byte[], PKM>>
{
    { "pk3", bytes => new PK3(bytes) },
    { "pk7", bytes => new PK7(bytes) },
};

static object PkmToJsonObject(PKM pk)
{
    if (pk is PK7 pk7)
    {
        return Pk7Object.Build(pk7);
    }
    else if (pk is PK3 pk3)
    {
        return Pk3Object.Build(pk3);
    }
    else
    {
        return new { };
    }
}

foreach (var dir in pkmFileDirs)
{
    Console.WriteLine($"Found directory: {dir}");
    if (!pkmClassByDir.ContainsKey(Path.GetFileName(dir)))
    {
        Console.WriteLine($"No PKM class defined for directory: {dir}");
        continue;
    }
    var factory = pkmClassByDir[Path.GetFileName(dir)];

    foreach (var path in Directory.EnumerateFiles(dir, "*.pk*", SearchOption.AllDirectories))
    {
        Console.WriteLine($"Processing: {path}");
        var pk = factory(File.ReadAllBytes(path));
        var dto = PkmToJsonObject(pk);
        var json = JsonSerializer.Serialize(dto, new JsonSerializerOptions { WriteIndented = true });

        var jsonDir = Path.Combine("json", Path.GetFileName(dir));
        Directory.CreateDirectory(jsonDir);
        var outPath = Path.Combine(jsonDir, Path.GetFileNameWithoutExtension(path) + ".json");
        File.WriteAllText(outPath, json);
        Console.WriteLine($"Written: {outPath}");
    }
}

// ========================
// GEN 3 SAVE EXPORT
// Uses Rust internal JSON names for Pokémon via Pk3Object.Build
// Source save: ./test-files/gen3-hoenn/emerald.sav
// ========================

static object SavePokemonToJsonObject(PKM pk)
{
    if (pk is PK3 pk3)
        return Pk3Object.Build(pk3);

    if (pk is PK7 pk7)
        return Pk7Object.Build(pk7);

    return new { };
}

static object ExportSaveFile(SaveFile sav)
{
    var trainer = new
    {
        name = sav.OT,
        tid = sav.TID16,
        sid = sav.SID16,
        gender = sav.Gender,
        played_hours = sav.PlayedHours,
        played_minutes = sav.PlayedMinutes,
        played_seconds = sav.PlayedSeconds,
        money = sav.Money,
        generation = sav.Generation,
        game = sav.Version.ToString()
    };

    var party = new List<object>();

    if (sav.HasParty)
    {
        for (int i = 0; i < sav.PartyCount; i++)
        {
            var pk = sav.GetPartySlotAtIndex(i);

            if (pk.Species == 0)
                continue;

            party.Add(SavePokemonToJsonObject(pk));
        }
    }

    var boxes = new List<object>();

    for (int b = 0; b < sav.BoxCount; b++)
    {
        var boxMons = new List<object>();

        for (int s = 0; s < sav.BoxSlotCount; s++)
        {
            var pk = sav.GetBoxSlotAtIndex(b, s);

            if (pk.Species == 0)
                continue;

            boxMons.Add(SavePokemonToJsonObject(pk));
        }

        boxes.Add(new
        {
            box_index = b,
            pokemon = boxMons
        });
    }

    return new
    {
        trainer = trainer,
        party = party,
        boxes = boxes
    };
}

var savePath = Path.Join("test-files",  "save-files", "gen3-hoenn", "emerald.sav");

if (!File.Exists(savePath))
{
    Console.WriteLine($"Save file not found: {savePath}");
}
else if (!SaveUtil.TryGetSaveFile(savePath, out SaveFile? saveFile) || saveFile == null)
{
    Console.WriteLine($"Unsupported or invalid save file: {savePath}");
}
else
{
    Console.WriteLine($"Processing save: {savePath}");

    var dto = ExportSaveFile(saveFile);

    var json = JsonSerializer.Serialize(
        dto,
        new JsonSerializerOptions
        {
            WriteIndented = true
        }
    );

    var outDir = Path.Join("json", "gen3-hoenn");
    Directory.CreateDirectory(outDir);

    var outPath = Path.Join(outDir, "emerald.json");
    File.WriteAllText(outPath, json);

    Console.WriteLine($"Written save JSON: {outPath}");
}