using PKHeX.Core;

public static class Pk3Object
{

  public static object Build(PK3 pk)
  {
    pk.ResetPartyStats();
    var languageCode = Language.GetLanguageCode((LanguageID)pk.Language);
    var strings = GameInfo.GetStrings(languageCode);
    return new
    {
      sanity = 0,
      checksum = pk.Checksum,
      pokemon_index = pk.SpeciesInternal,
      held_item_index = pk.HeldItem == 0 ? null : (object)pk.HeldItem,
      trainer_id = pk.TID16,
      secret_id = pk.SID16,
      exp = pk.EXP,
      has_species_data = pk.FlagHasSpecies,
      is_bad_egg = pk.FlagIsBadEgg,
      ability_num = Util.FormatAbilityNum(pk.AbilityNumber),
      markings = Util.MarkingsFourShapes(pk),
      personality_value = pk.PID,
      is_fateful_encounter = pk.FatefulEncounter,
      gender = Util.FormatGender(pk.Gender),
      evs = Util.EVs(pk),
      contest = Util.ContestStats(pk),
      pokerus_byte = pk.PokerusState,
      ribbons = Util.GetRibbons(pk),
      nickname = pk.Nickname,
      moves = Util.AllMoveData(pk, strings),
      ivs = Util.IVs(pk),
      is_egg = pk.IsEgg,
      trainer_name = pk.OriginalTrainerName,
      trainer_friendship = pk.OriginalTrainerFriendship,
      met_location_index = pk.MetLocation,
      ball = Util.FormatBall(pk, strings),
      met_level = pk.MetLevel,
      trainer_gender = Util.FormatGender(pk.OriginalTrainerGender),
      game_of_origin = strings.gamelist.GetValue((int)pk.Version),
      language = Util.FormatLanguageName(pk.Language),
      status_condition = pk.Status_Condition,
      stat_level = pk.Stat_Level,
      current_hp = pk.Stat_HPCurrent,
      stats = Util.Stats(pk),
    };
  }
}