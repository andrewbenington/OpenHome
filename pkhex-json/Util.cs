using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using PKHeX.Core;

public static class Util
{

  public static object SpeciesAndForme(PKM pk)
  {
    return new { national_dex = pk.Species.ToString() + " (" + SpeciesName.GetSpeciesNameGeneration(pk.Species, pk.Language, pk.Format) + ")", forme_index = pk.Form };
  }

  public static string FormatAbilityNum(int abilityNum)
  {
    return abilityNum switch
    {
      1 => "First",
      2 => "Second",
      4 => "Hidden",
      _ => throw new ArgumentException($"Unexpected ability number: {abilityNum}"),
    };
  }

  static string FormatMarkingColor(MarkingColor color)
  {
    return color switch
    {
      MarkingColor.Pink => "Red",
      MarkingColor.Blue => "Blue",
      MarkingColor.None => "Unset",
      _ => throw new ArgumentException($"Unexpected marking color: {color}"),
    };
  }

  public static object MarkingsSixShapesColors(IAppliedMarkings7 pk)
  {
    return new
    {
      circle = FormatMarkingColor(pk.MarkingCircle),
      square = FormatMarkingColor(pk.MarkingSquare),
      triangle = FormatMarkingColor(pk.MarkingTriangle),
      heart = FormatMarkingColor(pk.MarkingHeart),
      star = FormatMarkingColor(pk.MarkingStar),
      diamond = FormatMarkingColor(pk.MarkingDiamond)
    };
  }

  public static string FormatGender(byte gender)
  {
    return gender switch
    {
      0 => "Male",
      1 => "Female",
      2 => "Genderless",
      _ => throw new ArgumentException($"Unexpected gender value: {gender}"),
    };
  }

  public static object IVs(PKM pk)
  {
    return new { hp = pk.IV_HP, atk = pk.IV_ATK, def = pk.IV_DEF, spa = pk.IV_SPA, spd = pk.IV_SPD, spe = pk.IV_SPE };
  }

  public static object EVs(PKM pk)
  {
    return new { hp = pk.EV_HP, atk = pk.EV_ATK, def = pk.EV_DEF, spa = pk.EV_SPA, spd = pk.EV_SPD, spe = pk.EV_SPE };
  }

  public static object Stats(PKM pk)
  {
    return new { hp = pk.Stat_HPCurrent, atk = pk.Stat_ATK, def = pk.Stat_DEF, spa = pk.Stat_SPA, spd = pk.Stat_SPD, spe = pk.Stat_SPE };
  }

  public static object ContestStats(IContestStats pk)
  {
    return new { cool = pk.ContestCool, beauty = pk.ContestBeauty, cute = pk.ContestCute, smart = pk.ContestSmart, tough = pk.ContestTough, sheen = pk.ContestSheen };
  }

  static object FormatMoveName(int moveId, GameStrings strings)
  {
    return moveId == 0 ? "<empty>" : strings.movelist.GetValue(moveId);
  }

  static object MoveData(PKM pk, int moveIndex, GameStrings strings)
  {
    var moveId = moveIndex switch
    {
      1 => FormatMoveName(pk.Move1, strings),
      2 => FormatMoveName(pk.Move2, strings),
      3 => FormatMoveName(pk.Move3, strings),
      4 => FormatMoveName(pk.Move4, strings),
      _ => throw new ArgumentException($"Unexpected move index: {moveIndex}"),
    };
    var movePp = moveIndex switch
    {
      1 => pk.Move1_PP,
      2 => pk.Move2_PP,
      3 => pk.Move3_PP,
      4 => pk.Move4_PP,
      _ => throw new ArgumentException($"Unexpected move index: {moveIndex}"),
    };
    var movePpUps = moveIndex switch
    {
      1 => pk.Move1_PPUps,
      2 => pk.Move2_PPUps,
      3 => pk.Move3_PPUps,
      4 => pk.Move4_PPUps,
      _ => throw new ArgumentException($"Unexpected move index: {moveIndex}"),
    };
    return new { move_index = moveId, pp = movePp, pp_ups = movePpUps };
  }

  public static object[] AllMoveData(PKM pk, GameStrings strings)
  {
    return [MoveData(pk, 1, strings), MoveData(pk, 2, strings), MoveData(pk, 3, strings), MoveData(pk, 4, strings)];
  }

  static object RelearnMove(int moveIndex, PKM pk, GameStrings strings)
  {
    var moveId = moveIndex switch
    {
      1 => pk.RelearnMove1,
      2 => pk.RelearnMove2,
      3 => pk.RelearnMove3,
      4 => pk.RelearnMove4,
      _ => throw new ArgumentException($"Unexpected relearn move index: {moveIndex}"),
    };
    return FormatMoveName(moveId, strings);
  }

  public static object[] RelearnMoves(PKM pk, GameStrings strings)
  {
    return [RelearnMove(1, pk, strings), RelearnMove(2, pk, strings), RelearnMove(3, pk, strings), RelearnMove(4, pk, strings)];
  }

  static string ReformatRibbonName(string s)
  {
    var parts = Regex.Split(s, @"(?=[A-Z])").Where(p => p.Length > 0).ToArray();
    if (parts.Length == 3 && parts[1] == "Champion")
    {
      return $"{parts[2]} {parts[1]} {parts[0]}";
    }

    return string.Join(" ", parts.Skip(1).Append(parts[0]));
  }

  public static string[] GetRibbons(PKM pk)
  {
    var allRibbonInfo = RibbonInfo.GetRibbonInfo(pk);
    var ribbons = new List<string>();
    foreach (var ribbonInfo in allRibbonInfo)
    {
      if (ribbonInfo.HasRibbon)
      {
        ribbons.Add(ReformatRibbonName(ribbonInfo.Name));
      }
    }
    return ribbons.ToArray();
  }

  static object GeolocationData(IGeoTrack pk, int index)
  {
    var country = index switch
    {
      1 => pk.Geo1_Country,
      2 => pk.Geo2_Country,
      3 => pk.Geo3_Country,
      4 => pk.Geo4_Country,
      5 => pk.Geo5_Country,
      _ => throw new ArgumentException($"Unexpected geolocation index: {index}"),
    };
    var region = index switch
    {
      1 => pk.Geo1_Region,
      2 => pk.Geo2_Region,
      3 => pk.Geo3_Region,
      4 => pk.Geo4_Region,
      5 => pk.Geo5_Region,
      _ => throw new ArgumentException($"Unexpected geolocation index: {index}"),
    };
    return new { region, country };
  }

  public static object[] Geolocations(IGeoTrack pk)
  {
    return [GeolocationData(pk, 1), GeolocationData(pk, 2), GeolocationData(pk, 3), GeolocationData(pk, 4), GeolocationData(pk, 5)];
  }

  public static object TrainerMemoryData(IMemoryOT pk)
  {
    return new
    {
      intensity = pk.OriginalTrainerMemoryIntensity,
      memory = pk.OriginalTrainerMemory,
      feeling = pk.OriginalTrainerMemoryFeeling,
      text_variable = pk.OriginalTrainerMemoryVariable,
    };
  }

  public static object HandlerMemoryData(IMemoryHT pk)
  {
    return new
    {
      intensity = pk.HandlingTrainerMemoryIntensity,
      memory = pk.HandlingTrainerMemory,
      feeling = pk.HandlingTrainerMemoryFeeling,
      text_variable = pk.HandlingTrainerMemoryVariable,
    };
  }

  public static object HyperTrainingData(IHyperTrain pk)
  {
    return new
    {
      hp = pk.HT_HP,
      atk = pk.HT_ATK,
      def = pk.HT_DEF,
      spa = pk.HT_SPA,
      spd = pk.HT_SPD,
      spe = pk.HT_SPE
    };
  }

  public static object FormatLanguageName(int language)
  {
    return language switch
    {
      0 => "None",
      1 => "Japanese",
      2 => "English",
      3 => "French",
      4 => "Italian",
      5 => "German",
      6 => "UNUSED",
      7 => "SpanishSpain",
      8 => "Korean",
      9 => "ChineseSimplified",
      10 => "ChineseTraditional",
      11 => "SpanishLatinAmerica",
      _ => throw new ArgumentException($"Unexpected language value: {language}"),
    };
  }

  public static object FormatBall(PKM pk, GameStrings strings)
  {
    return strings.balllist.GetValue(pk.Ball).ToString().Replace(" Ball", "").Replace("Poke", "Poké");
  }
}