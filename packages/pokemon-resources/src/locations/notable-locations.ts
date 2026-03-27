export type NotableLocationKey =
  /* General */
  | 'LinkTrade'
  | 'CantTell'
  | 'PalPark'
  | 'PokeTransferLab'
  | 'GoPark'
  | 'DistantLand'
  | 'FarawayPlace'
  | 'FatefulEncounter'
  /* Regions */
  | 'KantoFrLg'
  | 'KantoVirtualConsole'
  | 'KantoLetsGo'
  | 'JohtoHgSs'
  | 'JohtoVirtualConsole'
  | 'HoennRse'
  | 'HoennORAS'
  | 'SinnohDPPt'
  | 'SinnohBDSP'
  | 'Unova'
  | 'Kalos'
  | 'Lumiose'
  | 'Alola'
  | 'Galar'
  | 'Hisui'
  | 'Paldea'
  /* Games */
  | 'PokemonGo'
  | 'PokemonHome'

type FormatNotableLocations = Partial<Record<NotableLocationKey, number>> & { LinkTrade: number }

export const NotableLocations = {
  PK2: {
    CantTell: 126,
    LinkTrade: 126,
  },
  PK3: {
    LinkTrade: 254,
    FatefulEncounter: 255,
  },
  PK4: {
    PalPark: 55,
    LinkTrade: 2001,
    // Link Trade 2002,
    KantoFrLg: 2003,
    JohtoHgSs: 2004,
    HoennRse: 2005,
    SinnohDPPt: 2006,
    // ----------: 2007,
    DistantLand: 2008,
  },
  PK5: {
    PokeTransferLab: 60,
    // －－－－－－－－－－: 30001
    LinkTrade: 30002,
    // Link Trade 30003,
    KantoFrLg: 30004,
    JohtoHgSs: 30005,
    HoennRse: 30006,
    SinnohDPPt: 30007,
    DistantLand: 30008,
    FarawayPlace: 40002,
  },
  PK6: {
    LinkTrade: 30001,
    // Link Trade 30002,
    KantoFrLg: 30003,
    JohtoHgSs: 30004,
    HoennRse: 30005,
    SinnohDPPt: 30006,
    DistantLand: 30007,
    // ——————: 30008,
    Unova: 30009,
    Kalos: 30010,
    FarawayPlace: 40002,
  },
  PK7: {
    LinkTrade: 30001,
    // Link Trade 30002,
    KantoFrLg: 30003,
    JohtoHgSs: 30004,
    HoennRse: 30005,
    SinnohDPPt: 30006,
    DistantLand: 30007,
    // ----------: 30008,
    Unova: 30009,
    Kalos: 30010,
    // Pokémon Link: 30011,
    PokemonGo: 30012,
    KantoVirtualConsole: 30013,
    HoennORAS: 30014,
    Alola: 30015,
    // Poké Pelago: 30016,
    JohtoVirtualConsole: 30017,
  },
  PB7: {
    GoPark: 50,
    LinkTrade: 30001,
    // Link Trade 30002,
    KantoFrLg: 30003,
    JohtoHgSs: 30004,
    HoennRse: 30005,
    SinnohDPPt: 30006,
    DistantLand: 30007,
    // ——————: 30008,
    Unova: 30009,
    Kalos: 30010,
    // Pokémon Link: 30011,
    PokemonGo: 30012,
    KantoVirtualConsole: 30013,
    HoennORAS: 30014,
    Alola: 30015,
    // Poké Pelago: 30016,
    JohtoVirtualConsole: 30017,
  },
  PK8: {
    LinkTrade: 30001,
    // Link Trade 30002,
    KantoFrLg: 30003,
    JohtoHgSs: 30004,
    HoennRse: 30005,
    SinnohDPPt: 30006,
    DistantLand: 30007,
    // ——————: 30008,
    Unova: 30009,
    Kalos: 30010,
    // Pokémon Link: 30011,
    PokemonGo: 30012,
    KantoVirtualConsole: 30013,
    HoennORAS: 30014,
    Alola: 30015,
    // Poké Pelago: 30016,
    JohtoVirtualConsole: 30017,
    PokemonHome: 30018,
    KantoLetsGo: 30019,
    FarawayPlace: 40002,
  },
  PB8: {
    LinkTrade: 30001,
    // Link Trade 30002,
    KantoFrLg: 30003,
    JohtoHgSs: 30004,
    HoennRse: 30005,
    SinnohDPPt: 30006,
    DistantLand: 30007,
    // ——————: 30008,
    Unova: 30009,
    Kalos: 30010,
    // Pokémon Link: 30011,
    PokemonGo: 30012,
    KantoVirtualConsole: 30013,
    HoennORAS: 30014,
    Alola: 30015,
    // Poké Pelago: 30016,
    JohtoVirtualConsole: 30017,
    PokemonHome: 30018,
    KantoLetsGo: 30019,
    Galar: 30020,
    // (empty Hisui placeholder): 30021,
    SinnohBDSP: 30022,
    FarawayPlace: 40002,
  },
  PA8: {
    LinkTrade: 30001,
    // Link Trade 30002,
    KantoFrLg: 30003,
    JohtoHgSs: 30004,
    HoennRse: 30005,
    SinnohDPPt: 30006,
    DistantLand: 30007,
    // ——————: 30008,
    Unova: 30009,
    Kalos: 30010,
    // Pokémon Link: 30011,
    PokemonGo: 30012,
    KantoVirtualConsole: 30013,
    HoennORAS: 30014,
    Alola: 30015,
    // Poké Pelago: 30016,
    JohtoVirtualConsole: 30017,
    PokemonHome: 30018,
    KantoLetsGo: 30019,
    Galar: 30020,
    Hisui: 30021,
    SinnohBDSP: 30022,
    FarawayPlace: 40002,
  },
  PK9: {
    LinkTrade: 30001,
    // Link Trade 30002,
    KantoFrLg: 30003,
    JohtoHgSs: 30004,
    HoennRse: 30005,
    SinnohDPPt: 30006,
    DistantLand: 30007,
    // ——————: 30008,
    Unova: 30009,
    Kalos: 30010,
    // Pokémon Link: 30011,
    PokemonGo: 30012,
    KantoVirtualConsole: 30013,
    HoennORAS: 30014,
    Alola: 30015,
    // Poké Pelago: 30016,
    JohtoVirtualConsole: 30017,
    PokemonHome: 30018,
    KantoLetsGo: 30019,
    Galar: 30020,
    Hisui: 30021,
    SinnohBDSP: 30022,
    FarawayPlace: 40002,
  },
  PA9: {
    LinkTrade: 30001,
    // Link Trade 30002,
    KantoFrLg: 30003,
    JohtoHgSs: 30004,
    HoennRse: 30005,
    SinnohDPPt: 30006,
    DistantLand: 30007,
    // ——————: 30008,
    Unova: 30009,
    Kalos: 30010,
    // Pokémon Link: 30011,
    PokemonGo: 30012,
    KantoVirtualConsole: 30013,
    HoennORAS: 30014,
    Alola: 30015,
    // Poké Pelago: 30016,
    JohtoVirtualConsole: 30017,
    PokemonHome: 30018,
    KantoLetsGo: 30019,
    Galar: 30020,
    Hisui: 30021,
    SinnohBDSP: 30022,
    // a picnic: 30023,
    // a crystal cavern: 30024,
    Paldea: 30025,
    Lumiose: 30026,
    FarawayPlace: 40002,
  },
} as const satisfies Partial<Record<string, FormatNotableLocations>>
