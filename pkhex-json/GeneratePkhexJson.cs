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
    { "pk8", bytes => new PK8(bytes) },
    { "pk9", bytes => new PK9(bytes) },
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
        return new {};
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
