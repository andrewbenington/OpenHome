import logging
import re
from enum import Enum

import requests
from bs4 import BeautifulSoup
from pydantic import BaseModel, Field

from national_dex import NationalDex
from querier import PokemonSpriteGroup, SpriteSource

logger = logging.getLogger(__name__)


class PokemonType(str, Enum):
    NORMAL = "Normal"
    FIRE = "Fire"
    WATER = "Water"
    ELECTRIC = "Electric"
    GRASS = "Grass"
    ICE = "Ice"
    FIGHTING = "Fighting"
    POISON = "Poison"
    GROUND = "Ground"
    FLYING = "Flying"
    PSYCHIC = "Psychic"
    BUG = "Bug"
    ROCK = "Rock"
    GHOST = "Ghost"
    DRAGON = "Dragon"
    DARK = "Dark"
    STEEL = "Steel"
    FAIRY = "Fairy"


class EggGroup(str, Enum):
    MONSTER = "Monster"
    WATER_1 = "Water 1"
    BUG = "Bug"
    FLYING = "Flying"
    FIELD = "Field"
    FAIRY = "Fairy"
    GRASS = "Grass"
    HUMAN_LIKE = "Human-Like"
    WATER_3 = "Water 3"
    MINERAL = "Mineral"
    AMORPHOUS = "Amorphous"
    WATER_2 = "Water 2"
    DITTO = "Ditto"
    DRAGON = "Dragon"
    UNDISCOVERED = "Undiscovered"


class GenderRatio(str, Enum):
    GENDERLESS = "Genderless"
    ALL_MALE = "AllMale"
    ALL_FEMALE = "AllFemale"
    EQUAL = "Equal"
    M1_TO_F7 = "M1ToF7"
    M1_TO_F3 = "M1ToF3"
    M7_TO_F1 = "M7ToF1"
    M3_TO_F1 = "M3ToF1"


class Regional(str, Enum):
    ALOLA = "Alola"
    GALAR = "Galar"
    HISUI = "Hisui"
    PALDEA = "Paldea"


sweets = [
    "strawberry",
    "berry",
    "love",
    "star",
    "clover",
    "flower",
    "ribbon",
]


# fmt: off
GENDER_DIFFERENCES = [
    3, 12, 19, 20, 25, 26, 41, 42, 44, 45, 64, 65, 84, 85, 97, 111, 112, 118,
    119, 123, 129, 130, 133, 154, 165, 166, 178, 185, 186, 190, 194, 195, 198,
    202, 203, 207, 208, 212, 214, 215, 215, 217, 221, 224, 229, 232, 255, 256,
    257, 267, 269, 272, 274, 275, 307, 308, 315, 316, 317, 322, 323, 332, 350,
    369, 396, 397, 398, 399, 400, 401, 402, 403, 404, 405, 407, 415, 417, 418,
    419, 424, 443, 444, 445, 449, 450, 453, 454, 456, 457, 459, 460, 461, 464,
    465, 473, 521, 592, 593, 668, 876, 902]



IN_CHAMPIONS = [
    3, 6, 9, 15, 18, 24, 25, 26, 36, 38, 45, 59, 65, 68, 71, 80, 94, 115, 121, 127, 128, 130, 132,
    134, 135, 136, 142, 143, 149, 154, 157, 160, 168, 181, 184, 186, 196, 197, 199, 205, 208, 211,
    212, 214, 227, 229, 248, 254, 257, 260, 279, 282, 302, 303, 306, 308, 310, 319, 323, 324, 334,
    350, 351, 354, 358, 359, 362, 376, 389, 392, 395, 398, 405, 407, 409, 411, 428, 442, 445, 448,
    450, 454, 460, 461, 464, 470, 471, 472, 473, 475, 478, 479, 497, 500, 503, 505, 510, 512, 514,
    516, 518, 530, 531, 534, 545, 547, 553, 560, 563, 569, 571, 579, 584, 587, 604, 609, 614, 618,
    623, 635, 637, 652, 655, 658, 660, 663, 666, 668, 670, 671, 675, 676, 678, 681, 683, 685, 687, 
    689, 691, 693, 695, 697, 699, 700, 701, 702, 706, 707, 709, 711, 713, 715, 724, 727, 730, 733, 
    740, 745, 748, 750, 752, 758, 763, 765, 766, 778, 780, 784, 823, 841, 842, 844, 855, 858, 861, 
    866, 867, 869, 870, 877, 887, 899, 900, 902, 903, 904, 908, 911, 914, 925, 934, 936, 937, 939,
    952, 956, 959, 964, 968, 970, 972, 979, 981, 983, 1000, 1013, 1018, 1019, 40, 53, 83, 122, 317,
    373, 673, 768, 812, 815, 818, 828, 849, 853, 863, 865, 871, 876, 930, 931, 943, 998]
# fmt: on


class SimplePokemonForm(BaseModel):
    national_dex: int = Field(..., description="National Pokédex number")
    form_index: int = Field(..., description="Index of this form")

    name: str = Field(..., description="Internal name of the form")
    display_name: str = Field(..., description="Display name of the form")

    sprite_name: str = Field(..., description="Name of sprite file")


class PokemonForm(SimplePokemonForm):
    """Represents a Pokémon form in the database."""

    # Primary Key
    national_dex: int = Field(..., description="National Pokédex number")
    form_index: int = Field(..., description="Index of this form")

    # Basic Info
    name: str = Field(..., description="Internal name of the form")
    display_name: str = Field(..., description="Display name of the form")

    # Types
    type1: PokemonType = Field(..., description="Primary type")
    type2: PokemonType | None = Field(None, description="Secondary type")

    # Base Stats
    base_hp: int = Field(..., ge=0, description="Base HP stat")
    base_attack: int = Field(..., ge=0, description="Base Attack stat")
    base_defense: int = Field(..., ge=0, description="Base Defense stat")
    base_special_attack: int = Field(..., ge=0, description="Base Special Attack stat")
    base_special_defense: int = Field(
        ..., ge=0, description="Base Special Defense stat"
    )
    base_speed: int = Field(..., ge=0, description="Base Speed stat")

    # Abilities
    ability1: int = Field(..., description="Primary ability ID")
    ability2: int | None = Field(None, description="Secondary ability ID")
    ability_hidden: int | None = Field(None, description="Hidden ability ID")

    # Breeding
    egg_group1: EggGroup = Field(..., description="Primary egg group")
    egg_group2: EggGroup | None = Field(None, description="Secondary egg group")
    gender_ratio: GenderRatio | None = Field(None, description="Gender distribution")

    # Physical Attributes
    height_decimeters: int = Field(..., ge=0, description="Height in decimeters")
    weight_hectograms: int = Field(..., ge=0, description="Weight in hectograms")

    # Form Flags
    is_base_form: bool = Field(..., description="Is this the base form?")
    is_mega: bool = Field(..., description="Is this a Mega Evolution?")
    is_gmax: bool = Field(..., description="Is this a Gigantamax form?")
    is_battle_only: bool = Field(..., description="Is this form battle-only?")
    is_sublegendary: bool = Field(..., description="Is this a sub-legendary?")
    is_restricted_legendary: bool = Field(
        ..., description="Is this a restricted legendary?"
    )
    is_ultra_beast: bool = Field(..., description="Is this an Ultra Beast?")
    is_paradox: bool = Field(..., description="Is this a Paradox Pokémon?")
    is_mythical: bool = Field(..., description="Is this a Mythical Pokémon?")

    # Regional Variant
    regional: Regional | None = Field(None, description="Regional variant type")

    # Generation
    introduced_gen: int = Field(..., ge=1, le=9, description="Generation introduced")

    # Sprite Info
    sprite_name: str = Field(..., description="Name of sprite file")
    sprite_row: int = Field(..., ge=0, description="Sprite sheet row")
    sprite_col: int = Field(..., ge=0, description="Sprite sheet column")

    class Config:
        """Pydantic configuration."""

        use_enum_values = True  # Use enum values instead of enum objects
        validate_assignment = True  # Validate on assignment

    def variant_sprite_names(self) -> list[str]:
        if self.national_dex == NationalDex.ALCREMIE:
            return [self.sprite_name + f"-{s}" for s in sweets]

        return [self.sprite_name]

    def pokemon_db_format(self) -> str:
        formatted = self.sprite_name
        if "-core" in self.name:
            match = re.match(MINIOR_CORE_PATTERN, self.name)

            if match:
                return f"{match.group(1)}-{match.group(2)}-core"

        formatted = formatted.replace("galar", "galarian")

        if self.national_dex == 555 and "zen" not in self.name:
            return self.sprite_name + "-standard"
        if self.sprite_name.endswith("pokeball"):
            return self.sprite_name[:-4] + "-ball"
        elif self.sprite_name.endswith("-alola"):
            return self.sprite_name + "n"
        elif "paldea" in self.sprite_name:
            return self.sprite_name.replace("paldea", "paldean")
        elif self.sprite_name.endswith("-hisui"):
            return self.sprite_name + "an"
        elif self.sprite_name.endswith("-exclamation"):
            return self.sprite_name[:-11] + "em"
        elif self.sprite_name.endswith("-question"):
            return self.sprite_name[:-8] + "qm"

        return formatted

    def pokemon_db_sprite_url(
        self, is_shiny: bool, source: SpriteSource, is_female=False
    ) -> str:
        form_name: str = self.pokemon_db_format()
        female_stats = ["indeedee-f", "meowstic-f", "oinkologne-f", "basculegion-f"]
        if (
            source == SpriteSource.HOME
            or source == SpriteSource.SCARLET_VIOLET
            and form_name in female_stats
        ):
            form_name += "emale"
        elif source == SpriteSource.BANK and form_name.endswith("-core"):
            form_name = form_name[:-5]
        elif form_name == "pikachu-partner-cap":
            form_name = "pikachu-johto-cap"
        elif source == SpriteSource.BLACK_WHITE and (
            "therian" in form_name or "kyurem-" in form_name or "resolute" in form_name
        ):
            source = SpriteSource.BLACK_WHITE_2
        elif source == SpriteSource.RED_BLUE:
            form_name += "-color"
        elif source == SpriteSource.BLACK_WHITE and "darmanitan" in form_name:
            form_name += "-mode"
        if (
            self.national_dex == NationalDex.OGERPON
            and source == SpriteSource.SCARLET_VIOLET
        ):
            form_name = form_name.removesuffix("-mask")
        if form_name.endswith("-four") and source == SpriteSource.SCARLET_VIOLET:
            form_name = form_name.replace("-four", "-family4")
        if "-core-" in form_name and source == SpriteSource.SCARLET_VIOLET:
            form_name = form_name.replace("core-", "") + "-core"
        shininess = "normal" if not is_shiny or not source.has_shinies() else "shiny"
        female_tag = (
            "-female"
            if is_female and form_name in female_stats
            else ("-f" if is_female else "")
        )
        return f"https://img.pokemondb.net/sprites/{source.pokemondb_dir()}/{shininess}/{form_name}{female_tag}{source.file_extension()}"

    def bulbagarden_sprite_url(self, group: PokemonSpriteGroup) -> str | None:
        # if self.introduced_gen != 9 or not self.is_mega:
        #     return None
        segments = self.name.split("-")
        forme_name = "-" + "_".join(segments[1:]).replace("%", "_Percent").replace(
            "keball", "ké_Ball"
        ).replace("Paldea_Fire", "Paldea_Blaze").replace(
            "Paldea_Water", "Paldea_Aqua"
        ).replace(
            "_Striped", ""
        ).replace(
            " ", "_"
        )
        if "Totem" in forme_name:
            return ""
        if forme_name in ["-Meadow", "-Four"]:
            forme_name = ""
        elif "Pikachu-" in self.name:
            forme_name = forme_name[1:2]
        elif forme_name == "-La Reine":
            forme_name = "-La_Reine"
        elif (
            "_Cream" in forme_name
            or "Caramel_Swirl" in forme_name
            or "Rainbow_Swirl" in forme_name
        ) and group.sprite_source != SpriteSource.CHAMPIONS:
            forme_name = forme_name[:-6]
        elif self.name == "Tauros-Paldea":
            forme_name = "-Paldea_Combat"
        elif forme_name == "-Galar_Zen":
            forme_name = "GZ"
        elif forme_name == "-Original":
            forme_name = "-Original_Color"
        elif forme_name == "-Male_Mega" or forme_name == "-Female_Mega":
            forme_name = "-Mega"
        elif "-Mega_" in forme_name:
            forme_name = forme_name.replace("-Mega_", "M")
        elif "-Eternal" in forme_name:
            forme_name = "E"
        elif group.is_female:
            forme_name = "_f"

        if group.sprite_source == SpriteSource.CHAMPIONS:
            if forme_name == "-Super":
                forme_name = "-Jumbo"
            elif forme_name == "-Masterpiece" or "-Busted" in forme_name:
                forme_name = ""

        shiny_suffix = "_s" if group.is_shiny else ""

        if group.sprite_source == SpriteSource.HOME and "Vivillon" in self.name:
            forme_name = forme_name[1:4]
            shiny_suffix = "_s" if group.is_shiny else ""

        form_suffix = (
            ""
            if self.form_index == 0
            and not (
                self.national_dex == 666 or self.national_dex == 671 or group.is_female
            )
            else forme_name
        )

        bulbaFilePage = f"https://archives.bulbagarden.net/wiki/File:{group.sprite_source.prefix()}{str(self.national_dex).zfill(4)}{form_suffix}{shiny_suffix}.png"

        return self.bulbagarden_image_url_from_page(bulbaFilePage)

    @staticmethod
    def bulbagarden_image_url_from_page(url: str) -> str | None:
        # Send an HTTP request to the URL and get the page content
        response = requests.get(url)
        page_content = response.text

        # Create a BeautifulSoup object to parse the page content
        soup = BeautifulSoup(page_content, "html.parser")

        # Find the first image whose alt attribute starts with "File:"
        target_img = None

        for img in soup.find_all("img"):
            alt_text = img.get("alt")
            if alt_text and str(alt_text).startswith("File:"):
                target_img = img
                break

        # If a matching image is found, download it
        if target_img:
            return str(target_img.get("src"))

        logger.error(f"no image found for {url}")

    def gen3_form(self) -> str | None:
        if self.form_index > 0 or self.national_dex == 201:
            return self.name.split("-")[1]

    # Game Presence

    def has_gen456_sprite(self):
        if self.national_dex in FIRST_FORM_ONLY_456 and self.form_index > 0:
            return False

        return self.regional is None

    def has_gen45_sprite(self):
        if self.is_mega or "-Fairy" in self.name:
            return False

        return self.has_gen456_sprite()

    def has_gen4_sprite(self):
        return self.has_gen45_sprite()

    def has_gen5_sprite(self):
        if self.national_dex == NationalDex.PIKACHU and self.form_index > 0:
            return False

        return self.has_gen45_sprite()

    def has_alola_sprite(self):
        if (
            self.is_mega
            and self.national_dex in Z_MEGAS
            and self.form_index == MEGA_Z_FORM
        ):
            return False

        if self.regional and self.regional != Regional.ALOLA:
            return False
        if self.national_dex == NationalDex.PIKACHU and self.form_index > 7:
            return False
        if (
            self.national_dex == NationalDex.PICHU
            and self.form_index == SPIKY_EAR_PICHU
        ):
            return False
        return self.national_dex in ALOLA_DEX

    def has_legends_arceus_sprite(self):
        if self.national_dex == NationalDex.PIKACHU and self.form_index > 0:
            return False
        if (
            self.national_dex == NationalDex.PICHU
            and self.form_index == SPIKY_EAR_PICHU
        ):
            return False

        if self.is_mega:
            return False
        if self.regional:
            if self.regional != Regional.HISUI:
                if self.national_dex not in [NationalDex.VULPIX, NationalDex.NINETALES]:
                    return False
                if self.regional != Regional.ALOLA:
                    return False
        elif (
            self.national_dex in HISUIAN_FORMS
            and self.national_dex != NationalDex.SNEASEL
        ):
            return False

        return self.national_dex in LEGENDS_ARCEUS_DEX

    def has_za_sprite(self):
        return self.national_dex in LEGENDS_ZA_TRANSFERRABLE

    def has_scarlet_violet_sprite(self):
        if (
            self.national_dex == NationalDex.PICHU
            and self.form_index == SPIKY_EAR_PICHU
        ):
            return False

        if self.national_dex == NationalDex.PIKACHU:
            if self.form_index == STARTER_PIKACHU:
                return False
            if self.form_index > WORLD_PIKACHU:
                return False

        if "Greninja" in self.name and self.form_index > 0:
            return False

        if self.is_mega:
            return False

        if self.name in ["Floette-Eternal", "Necrozma-Ultra"]:
            return False

        if "-Primal" in self.name:
            return False

        return self.national_dex in SV_TRANSFERRABLE

    def has_home_sprite(self):
        return not (
            self.national_dex == NationalDex.PICHU
            and self.form_index == SPIKY_EAR_PICHU
        )

    def has_champions_sprite(self):
        match self.national_dex:
            case (
                NationalDex.PIKACHU
                | NationalDex.MR_MIME
                | NationalDex.QWILFISH
                | NationalDex.FARFETCHD
            ):
                return self.form_index == 0
            case NationalDex.GRENINJA:
                return self.form_index == 0 or self.form_index == GRENINJA_MEGA
            case NationalDex.FLOETTE:
                return self.form_index == FLOETTE_ETERNAL
            case ndex:
                return ndex in IN_CHAMPIONS

    def separate_female_sprite(self):
        return self.national_dex in GENDER_DIFFERENCES


class SpeciesRow(BaseModel):
    national_dex: int
    name: str


class SpeciesWithForms(BaseModel):
    national_dex: int
    name: str
    forms: list[PokemonForm]


MINIOR_CORE_PATTERN = r"^(.*)-core-(\w+)$"

SPIKY_EAR_PICHU = 1
FLOETTE_ETERNAL = 5
STARTER_PIKACHU = 8
WORLD_PIKACHU = 9
MR_MIME_GALAR = 1
GRENINJA_MEGA = 3

CAP_PIKACHUS = {
    25: [1, 2, 3, 4, 5, 6, 7, 9],
}

ALOLAN_FORMS = {
    19: [1],
    20: [1],
    26: [1],
    27: [1],
    28: [1],
    37: [1],
    38: [1],
    50: [1],
    51: [1],
    52: [1],
    53: [1],
    74: [1],
    75: [1],
    76: [1],
    88: [1],
    89: [1],
    103: [1],
    105: [1],
}

GALARIAN_FORMS = {
    52: [2],
    77: [1],
    78: [1],
    79: [1],
    80: [2],
    83: [1],
    110: [1],
    122: [1],
    144: [1],
    145: [1],
    146: [1],
    199: [1],
    222: [1],
    263: [1],
    264: [1],
    554: [1],
    555: [2, 3],
    562: [1],
    618: [1],
}

HISUIAN_FORMS = {
    58: [1],
    59: [1],
    100: [1],
    101: [1],
    157: [1],
    211: [1],
    215: [1],
    503: [1],
    549: [1],
    550: [2],
    570: [1],
    571: [1],
    628: [1],
    705: [1],
    706: [1],
    713: [1],
    724: [1],
}

PALDEAN_FORMS = {
    128: [1, 2, 3],
    194: [1],
}

TRANSFER_LOCKED_FORMS = {
    25: [8],
    133: [1],
    646: [1, 2],
    800: [1, 2],
    898: [1, 2],
}

PLA_EXCLUDED_FORMS = {
    **ALOLAN_FORMS,
    **GALARIAN_FORMS,
    37: None,
    38: None,
    58: [0],
    59: [0],
    100: [0],
    101: [0],
    157: [0],
    211: [0],
    215: None,
    503: [0],
    549: [0],
    550: [0, 1],
    570: [0],
    571: [0],
    628: [0],
    705: [0],
    706: [0],
    713: [0],
    721: [0],
}

REGIONAL_FORMS = {**ALOLAN_FORMS, **GALARIAN_FORMS, **HISUIAN_FORMS, **PALDEAN_FORMS}

POST_GEN7_REGIONALS = {**GALARIAN_FORMS, **HISUIAN_FORMS, **PALDEAN_FORMS}

# fmt: off
ALOLA_DEX = [
     10,  11,  12,  19,  20,  21,  22,  23,  24,  25,  26,  27,  28,  35,  36,
     37,  38,  39,  40,  41,  42,  46,  47,  50,  51,  52,  53,  54,  55,  56,
     57,  58,  59,  60,  61,  62,  63,  64,  65,  66,  67,  68,  72,  73,  74,
     75,  76,  79,  80,  81,  82,  86,  87,  88,  89,  90,  91,  92,  93,  94,
     96,  97, 102, 103, 104, 105, 108, 113, 115, 118, 119, 120, 121, 122, 123,
    124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138,
    139, 140, 141, 142, 143, 147, 148, 149, 163, 164, 165, 166, 167, 168, 169,
    170, 171, 172, 173, 174, 177, 178, 179, 180, 181, 185, 186, 190, 196, 197,
    198, 199, 200, 204, 205, 206, 209, 210, 212, 214, 215, 222, 223, 224, 225,
    226, 227, 228, 229, 233, 235, 238, 239, 240, 241, 242, 246, 247, 248, 278,
    279, 283, 284, 296, 297, 299, 302, 303, 309, 310, 318, 319, 320, 321, 324,
    327, 328, 329, 330, 339, 340, 341, 342, 343, 344, 345, 346, 347, 348, 349,
    350, 351, 352, 353, 354, 357, 359, 361, 362, 366, 367, 368, 369, 370, 371,
    372, 373, 374, 375, 376, 408, 409, 410, 411, 422, 423, 424, 425, 426, 427,
    428, 429, 430, 438, 439, 440, 443, 444, 445, 446, 447, 448, 456, 457, 458,
    461, 462, 463, 466, 467, 470, 471, 474, 476, 478, 506, 507, 508, 524, 525,
    526, 546, 547, 548, 549, 550, 551, 552, 553, 559, 560, 564, 565, 566, 567,
    568, 569, 570, 571, 572, 573, 582, 583, 584, 587, 592, 593, 594, 605, 606,
    619, 620, 621, 622, 623, 624, 625, 627, 628, 629, 630, 636, 637, 661, 662,
    663, 667, 668, 669, 670, 671, 674, 675, 676, 686, 687, 690, 691, 692, 693,
    696, 697, 698, 699, 700, 701, 702, 703, 704, 705, 706, 707, 708, 709, 714,
    715, 718, 722, 723, 724, 725, 726, 727, 728, 729, 730, 731, 732, 733, 734,
    735, 736, 737, 738, 739, 740, 741, 742, 743, 744, 745, 746, 747, 748, 749,
    750, 751, 752, 753, 754, 755, 756, 757, 758, 759, 760, 761, 762, 763, 764,
    765, 766, 767, 768, 769, 770, 771, 772, 773, 774, 775, 776, 777, 778, 779,
    780, 781, 782, 783, 784, 785, 786, 787, 788, 789, 790, 791, 792, 793, 794,
    795, 796, 797, 798, 799, 800, 801, 802, 803, 804, 805, 806, 807
]

SWSH_TRANSFERRABLE = [
      1,   2,   3,   4,   5,   6,   7,   8,   9,  10,  11,  12,  25,  26,  27,
     28,  29,  30,  31,  32,  33,  34,  35,  36,  37,  38,  39,  40,  41,  42,
     43,  44,  45,  50,  51,  52,  53,  54,  55,  58,  59,  60,  61,  62,  63,
     64,  65,  66,  67,  68,  72,  73,  77,  78,  79,  91,  92,  93,  94,  95,
     98,  99, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114,
    115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129,
    130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144,
    145, 146, 147, 148, 149, 150, 151, 163, 164, 169, 170, 171, 172, 173, 174,
    175, 176, 177, 178, 182, 183, 184, 185, 186, 194, 195, 196, 197, 199, 202,
    206, 208, 211, 212, 213, 214, 215, 220, 221, 222, 223, 224, 225, 226, 227,
    230, 233, 236, 237, 238, 239, 240, 241, 242, 243, 244, 245, 246, 247, 248,
    249, 250, 251, 252, 253, 254, 255, 256, 257, 258, 259, 260, 263, 264, 270,
    271, 272, 273, 274, 275, 278, 279, 280, 281, 282, 290, 291, 292, 293, 294,
    295, 298, 302, 303, 304, 305, 306, 309, 310, 315, 318, 319, 320, 321, 324,
    328, 329, 330, 333, 334, 337, 338, 339, 340, 341, 342, 343, 344, 345, 346,
    347, 348, 349, 350, 355, 356, 359, 360, 361, 362, 363, 364, 365, 369, 371,
    372, 373, 374, 375, 376, 377, 378, 379, 380, 381, 382, 383, 384, 385, 403,
    404, 405, 406, 407, 415, 416, 420, 421, 422, 423, 425, 426, 427, 428, 434,
    435, 436, 437, 438, 439, 440, 442, 443, 444, 445, 446, 447, 448, 449, 450,
    451, 452, 453, 454, 458, 459, 460, 461, 462, 463, 464, 465, 466, 467, 468,
    470, 471, 473, 474, 475, 477, 478, 479, 480, 481, 482, 483, 484, 485, 487,
    488, 494, 506, 507, 508, 509, 510, 517, 518, 519, 520, 521, 524, 525, 526,
    527, 528, 529, 530, 531, 532, 533, 534, 535, 536, 537, 538, 539, 543, 544,
    545, 546, 547, 548, 549, 550, 551, 552, 553, 554, 555, 556, 557, 558, 559,
    560, 561, 562, 563, 564, 565, 566, 567, 568, 569, 570, 571, 572, 573, 574,
    575, 576, 577, 578, 579, 582, 583, 584, 587, 588, 589, 590, 591, 592, 593,
    595, 596, 597, 598, 599, 600, 601, 605, 606, 607, 608, 609, 610, 611, 612,
    613, 614, 615, 616, 617, 618, 619, 620, 621, 622, 623, 624, 625, 626, 627,
    628, 629, 630, 631, 632, 633, 634, 635, 636, 637, 638, 639, 640, 641, 642,
    643, 644, 645, 646, 647, 649, 659, 660, 661, 662, 663, 674, 675, 677, 678,
    679, 680, 681, 682, 683, 684, 685, 686, 687, 688, 689, 690, 691, 692, 693,
    694, 695, 696, 697, 698, 699, 700, 701, 702, 703, 704, 705, 706, 707, 708,
    709, 710, 711, 712, 713, 714, 715, 716, 717, 718, 719, 721, 722, 723, 724,
    725, 726, 727, 728, 729, 730, 736, 737, 738, 742, 743, 744, 745, 746, 747,
    748, 749, 750, 751, 752, 753, 754, 755, 756, 757, 758, 759, 760, 761, 762,
    763, 764, 765, 766, 767, 768, 769, 770, 771, 772, 773, 776, 777, 778, 780,
    781, 782, 783, 784, 785, 786, 787, 788, 789, 790, 791, 792, 793, 794, 795,
    796, 797, 798, 799, 800, 801, 802, 803, 804, 805, 806, 807, 808, 809, 810,
    811, 812, 813, 814, 815, 816, 817, 818, 819, 820, 821, 822, 823, 824, 825,
    826, 827, 828, 829, 830, 831, 832, 833, 834, 835, 836, 837, 838, 839, 840,
    841, 842, 843, 844, 845, 846, 847, 848, 849, 850, 851, 852, 853, 854, 855,
    856, 857, 858, 859, 860, 861, 862, 863, 864, 865, 866, 867, 868, 869, 870,
    871, 872, 873, 874, 875, 876, 877, 878, 879, 880, 881, 882, 883, 884, 885,
    886, 887, 888, 889, 890, 891, 892, 893, 894, 895, 896, 897, 898
]

LEGENDS_ARCEUS_DEX = [
     25,  26,  35,  36,  37,  38,  41,  42,  46,  47,  54,  55,  58,  59,  63,
     64,  65,  66,  67,  68,  72,  73,  74,  75,  76,  77,  78,  81,  82,  92,
     93,  94,  95, 100, 101, 108, 111, 112, 113, 114, 122, 123, 125, 126, 129,
    130, 133, 134, 135, 136, 137, 143, 155, 156, 157, 169, 172, 173, 175, 176,
    185, 190, 193, 196, 197, 198, 200, 201, 207, 208, 211, 212, 214, 215, 216,
    217, 220, 221, 223, 224, 226, 233, 234, 239, 240, 242, 265, 266, 267, 268,
    269, 280, 281, 282, 299, 315, 339, 340, 355, 356, 358, 361, 362, 363, 364,
    365, 387, 388, 389, 390, 391, 392, 393, 394, 395, 396, 397, 398, 399, 400,
    401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415,
    416, 417, 418, 419, 420, 421, 422, 423, 424, 425, 426, 427, 428, 429, 430,
    431, 432, 433, 434, 435, 436, 437, 438, 439, 440, 441, 442, 443, 444, 445,
    446, 447, 448, 449, 450, 451, 452, 453, 454, 455, 456, 457, 458, 459, 460,
    461, 462, 463, 464, 465, 466, 467, 468, 469, 470, 471, 472, 473, 474, 475,
    476, 477, 478, 479, 480, 481, 482, 483, 484, 485, 486, 487, 488, 489, 490,
    491, 492, 493, 501, 502, 503, 548, 549, 550, 570, 571, 627, 628, 641, 642,
    645, 700, 704, 705, 706, 712, 713, 722, 723, 724, 899, 900, 901, 902, 903,
    904, 905
]

SV_TRANSFERRABLE =  [
       1,    2,    3,    4,    5,    6,    7,    8,    9,   23,   24,   25,   26,   27,   28,
      35,   36,   37,   38,   39,   40,   43,   44,   45,   48,   49,   50,   51,   52,   53,
      54,   55,   56,   57,   58,   59,   60,   61,   62,   69,   70,   71,   72,   73,   74,
      75,   76,   79,   80,   81,   82,   84,   85,   86,   87,   88,   89,   90,   91,   92,
      93,   94,   96,   97,  100,  101,  102,  103,  106,  107,  109,  110,  111,  112,  113,
     116,  117,  123,  125,  126,  128,  129,  130,  131,  132,  133,  134,  135,  136,  137,
     143,  144,  145,  146,  147,  148,  149,  150,  151,  152,  153,  154,  155,  156,  157,
     158,  159,  160,  161,  162,  163,  164,  170,  171,  172,  173,  174,  179,  180,  181,
     182,  183,  184,  185,  187,  188,  189,  190,  191,  192,  193,  194,  195,  196,  197,
     198,  199,  200,  203,  204,  205,  206,  207,  209,  210,  211,  212,  214,  215,  216,
     217,  218,  219,  220,  221,  225,  227,  228,  229,  230,  231,  232,  233,  234,  235,
     236,  237,  239,  240,  242,  243,  244,  245,  246,  247,  248,  249,  250,  252,  253,
     254,  255,  256,  257,  258,  259,  260,  261,  262,  270,  271,  272,  273,  274,  275,
     278,  279,  280,  281,  282,  283,  284,  285,  286,  287,  288,  289,  296,  297,  298,
     299,  302,  307,  308,  311,  312,  313,  314,  316,  317,  322,  323,  324,  325,  326,
     328,  329,  330,  331,  332,  333,  334,  335,  336,  339,  340,  341,  342,  349,  350,
     353,  354,  355,  356,  357,  358,  361,  362,  370,  371,  372,  373,  374,  375,  376,
     377,  378,  379,  380,  381,  382,  383,  384,  386,  387,  388,  389,  390,  391,  392,
     393,  394,  395,  396,  397,  398,  401,  402,  403,  404,  405,  408,  409,  410,  411,
     415,  416,  417,  418,  419,  422,  423,  424,  425,  426,  429,  430,  433,  434,  435,
     436,  437,  438,  440,  442,  443,  444,  445,  446,  447,  448,  449,  450,  456,  457,
     459,  460,  461,  462,  464,  466,  467,  469,  470,  471,  472,  473,  474,  475,  477,
     478,  479,  480,  481,  482,  483,  484,  485,  486,  487,  488,  492,  493,  495,  496,
     497,  498,  499,  500,  501,  502,  503,  522,  523,  529,  530,  532,  533,  534,  540,
     541,  542,  546,  547,  548,  549,  550,  551,  552,  553,  559,  560,  570,  571,  572,
     573,  574,  576,  577,  578,  579,  580,  581,  585,  586,  590,  591,  594,  595,  596,
     602,  603,  604,  607,  608,  609,  610,  611,  612,  613,  614,  615,  619,  620,  622,
     623,  624,  625,  627,  628,  629,  630,  633,  634,  635,  636,  637,  638,  639,  640,
     641,  642,  643,  644,  645,  646,  647,  648,  650,  651,  652,  653,  654,  655,  656,
     657,  658,  661,  662,  663,  664,  665,  666,  667,  668,  669,  670,  671,  672,  673,
     677,  678,  686,  687,  690,  691,  692,  693,  700,  701,  702,  703,  704,  705,  706,
     707,  708,  709,  712,  713,  714,  715,  719,  720,  721,  722,  723,  724,  725,  726,
     727,  728,  729,  730,  731,  732,  733,  734,  735,  736,  737,  738,  739,  740,  741,
     742,  744,  745,  747,  748,  749,  750,  751,  752,  753,  754,  757,  758,  761,  762,
     763,  764,  765,  766,  769,  770,  774,  775,  778,  779,  782,  783,  784,  789,  790,
     791,  792,  800,  801,  810,  811,  812,  813,  814,  815,  816,  817,  818,  819,  820,
     821,  822,  823,  833,  834,  837,  838,  839,  840,  841,  842,  843,  844,  845,  846,
     847,  848,  849,  854,  855,  856,  857,  858,  859,  860,  861,  863,  868,  869,  870,
     871,  872,  873,  874,  875,  876,  878,  879,  884,  885,  886,  887,  888,  889,  890,
     891,  892,  893,  894,  895,  896,  897,  898,  899,  900,  901,  902,  903,  904,  905,
     906,  907,  908,  909,  910,  911,  912,  913,  914,  915,  916,  917,  918,  919,  920,
     921,  922,  923,  924,  925,  926,  927,  928,  929,  930,  931,  932,  933,  934,  935,
     936,  937,  938,  939,  940,  941,  942,  943,  944,  945,  946,  947,  948,  949,  950,
     951,  952,  953,  954,  955,  956,  957,  958,  959,  960,  961,  962,  963,  964,  965,
     966,  967,  968,  969,  970,  971,  972,  973,  974,  975,  976,  977,  978,  979,  980,
     981,  982,  983,  984,  985,  986,  987,  988,  989,  990,  991,  992,  993,  994,  995,
     996,  997,  998,  999, 1000, 1001, 1002, 1003, 1004, 1005, 1006, 1007, 1008, 1009, 1010,
    1011, 1012, 1013, 1014, 1015, 1016, 1017, 1018, 1019, 1020, 1021, 1022, 1023, 1024, 1025
]

LEGENDS_ZA_TRANSFERRABLE =  [
       1,    2,    3,    4,    5,    6,    7,    8,    9,   13,   14,   15,   16,   17,   18,
      23,   24,   25,   26,   35,   36,   39,   40,   41,   42,   52,   53,   56,   57,   63,
      64,   65,   66,   67,   68,   69,   70,   71,   79,   80,   83,   92,   93,   94,   95,
     104,  105,  115,  120,  121,  122,  123,  127,  129,  130,  133,  134,  135,  136,  137,
     142,  147,  148,  149,  150,  152,  153,  154,  158,  159,  160,  167,  168,  169,  172,
     173,  174,  179,  180,  181,  196,  197,  199,  208,  211,  212,  214,  225,  227,  228,
     229,  233,  246,  247,  248,  252,  253,  254,  255,  256,  257,  258,  259,  260,  280,
     281,  282,  302,  303,  304,  305,  306,  307,  308,  309,  310,  315,  316,  317,  318,
     319,  322,  323,  325,  326,  333,  334,  335,  336,  349,  350,  352,  353,  354,  358,
     359,  361,  362,  371,  372,  373,  374,  375,  376,  380,  381,  382,  383,  384,  396,
     397,  398,  406,  407,  427,  428,  433,  439,  443,  444,  445,  447,  448,  449,  450,
     459,  460,  470,  471,  474,  475,  478,  479,  485,  491,  498,  499,  500,  504,  505,
     509,  510,  511,  512,  513,  514,  515,  516,  517,  518,  529,  530,  531,  538,  539,
     543,  544,  545,  551,  552,  553,  559,  560,  562,  563,  568,  569,  582,  583,  584,
     587,  590,  591,  602,  603,  604,  607,  608,  609,  615,  618,  622,  623,  638,  639,
     640,  647,  648,  649,  650,  651,  652,  653,  654,  655,  656,  657,  658,  659,  660,
     661,  662,  663,  664,  665,  666,  667,  668,  669,  670,  671,  672,  673,  674,  675,
     676,  677,  678,  679,  680,  681,  682,  683,  684,  685,  686,  687,  688,  689,  690,
     691,  692,  693,  694,  695,  696,  697,  698,  699,  700,  701,  702,  703,  704,  705,
     706,  707,  708,  709,  710,  711,  712,  713,  714,  715,  716,  717,  718,  719,  720,
     721,  739,  740,  767,  768,  769,  770,  778,  780,  801,  802,  807,  808,  809,  821,
     822,  823,  827,  828,  848,  849,  852,  853,  863,  865,  866,  867,  870,  876,  877,
     900,  904,  926,  927,  931,  932,  933,  934,  935,  936,  937,  942,  943,  944,  945,
     951,  952,  957,  958,  959,  967,  969,  970,  971,  972,  973,  977,  978,  979,  996,
     997,  998,  999, 1000
]

Z_MEGAS = [359, 445, 448]
MEGA_Z_FORM = 2

GENDER_DIFFERENCES = [
      3,  12,  19,  20,  25,  26,  41,  42,  44,  45,  64,  65,  84,  85,  97,
    111, 112, 118, 119, 123, 129, 130, 133, 154, 165, 166, 178, 185, 186, 190,
    194, 195, 198, 202, 203, 207, 208, 212, 214, 215, 217, 221, 224, 229, 232,
    255, 256, 257, 267, 269, 272, 274, 275, 307, 308, 315, 316, 317, 322, 323,
    332, 350, 369, 396, 397, 398, 399, 400, 401, 402, 403, 404, 405, 407, 415,
    417, 418, 419, 424, 443, 444, 445, 449, 450, 453, 454, 456, 457, 459, 460,
    461, 464, 465, 473, 521, 592, 593, 668, 902
]
# fmt: on

SWSH_TRANSFERRABLE = [
      1,   2,   3,   4,   5,   6,   7,   8,   9,  10,  11,  12,  25,  26,  27,
     28,  29,  30,  31,  32,  33,  34,  35,  36,  37,  38,  39,  40,  41,  42,
     43,  44,  45,  50,  51,  52,  53,  54,  55,  58,  59,  60,  61,  62,  63,
     64,  65,  66,  67,  68,  72,  73,  77,  78,  79,  80,  81,  82,  83,  90,
     91,  92,  93,  94,  95,  98,  99, 102, 103, 104, 105, 106, 107, 108, 109,
    110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124,
    125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139,
    140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 163, 164, 169,
    170, 171, 172, 173, 174, 175, 176, 177, 178, 182, 183, 184, 185, 186, 194,
    195, 196, 197, 199, 202, 206, 208, 211, 212, 213, 214, 215, 220, 221, 222,
    223, 224, 225, 226, 227, 230, 233, 236, 237, 238, 239, 240, 241, 242, 243,
    244, 245, 246, 247, 248, 249, 250, 251, 252, 253, 254, 255, 256, 257, 258,
    259, 260, 263, 264, 270, 271, 272, 273, 274, 275, 278, 279, 280, 281, 282,
    290, 291, 292, 293, 294, 295, 298, 302, 303, 304, 305, 306, 309, 310, 315,
    318, 319, 320, 321, 324, 328, 329, 330, 333, 334, 337, 338, 339, 340, 341,
    342, 343, 344, 345, 346, 347, 348, 349, 350, 355, 356, 359, 360, 361, 362,
    363, 364, 365, 369, 371, 372, 373, 374, 375, 376, 377, 378, 379, 380, 381,
    382, 383, 384, 385, 403, 404, 405, 406, 407, 415, 416, 420, 421, 422, 423,
    425, 426, 427, 428, 434, 435, 436, 437, 438, 439, 440, 442, 443, 444, 445,
    446, 447, 448, 449, 450, 451, 452, 453, 454, 458, 459, 460, 461, 462, 463,
    464, 465, 466, 467, 468, 470, 471, 473, 474, 475, 477, 478, 479, 480, 481,
    482, 483, 484, 485, 487, 488, 494, 506, 507, 508, 509, 510, 517, 518, 519,
    520, 521, 524, 525, 526, 527, 528, 529, 530, 531, 532, 533, 534, 535, 536,
    537, 538, 539, 543, 544, 545, 546, 547, 548, 549, 550, 551, 552, 553, 554,
    555, 556, 557, 558, 559, 560, 561, 562, 563, 564, 565, 566, 567, 568, 569,
    570, 571, 572, 573, 574, 575, 576, 577, 578, 579, 582, 583, 584, 587, 588,
    589, 590, 591, 592, 593, 595, 596, 597, 598, 599, 600, 601, 605, 606, 607,
    608, 609, 610, 611, 612, 613, 614, 615, 616, 617, 618, 619, 620, 621, 622,
    623, 624, 625, 626, 627, 628, 629, 630, 631, 632, 633, 634, 635, 636, 637,
    638, 639, 640, 641, 642, 643, 644, 645, 646, 647, 649, 659, 660, 661, 662,
    663, 674, 675, 677, 678, 679, 680, 681, 682, 683, 684, 685, 686, 687, 688,
    689, 690, 691, 692, 693, 694, 695, 696, 697, 698, 699, 700, 701, 702, 703,
    704, 705, 706, 707, 708, 709, 710, 711, 712, 713, 714, 715, 716, 717, 718,
    719, 721, 722, 723, 724, 725, 726, 727, 728, 729, 730, 736, 737, 738, 742,
    743, 744, 745, 746, 747, 748, 749, 750, 751, 752, 753, 754, 755, 756, 757,
    758, 759, 760, 761, 762, 763, 764, 765, 766, 767, 768, 769, 770, 771, 772,
    773, 776, 777, 778, 780, 781, 782, 783, 784, 785, 786, 787, 788, 789, 790,
    791, 792, 793, 794, 795, 796, 797, 798, 799, 800, 801, 802, 803, 804, 805,
    806, 807, 808, 809, 810, 811, 812, 813, 814, 815, 816, 817, 818, 819, 820,
    821, 822, 823, 824, 825, 826, 827, 828, 829, 830, 831, 832, 833, 834, 835,
    836, 837, 838, 839, 840, 841, 842, 843, 844, 845, 846, 847, 848, 849, 850,
    851, 852, 853, 854, 855, 856, 857, 858, 859, 860, 861, 862, 863, 864, 865,
    866, 867, 868, 869, 870, 871, 872, 873, 874, 875, 876, 877, 878, 879, 880,
    881, 882, 883, 884, 885, 886, 887, 888, 889, 890, 891, 892, 893, 894, 895,
    896, 897, 898
]

LEGENDS_ARCEUS_DEX = [
     25,  26,  35,  36,  37,  38,  41,  42,  46,  47,  54,  55,  58,  59,  63,
     64,  65,  66,  67,  68,  72,  73,  74,  75,  76,  77,  78,  81,  82,  92,
     93,  94,  95, 100, 101, 108, 111, 112, 113, 114, 122, 123, 125, 126, 129,
    130, 133, 134, 135, 136, 137, 143, 155, 156, 157, 169, 172, 173, 175, 176,
    185, 190, 193, 196, 197, 198, 200, 201, 207, 208, 211, 212, 214, 215, 216,
    217, 220, 221, 223, 224, 226, 233, 234, 239, 240, 242, 265, 266, 267, 268,
    269, 280, 281, 282, 299, 315, 339, 340, 355, 356, 358, 361, 362, 363, 364,
    365, 387, 388, 389, 390, 391, 392, 393, 394, 395, 396, 397, 398, 399, 400,
    401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415,
    416, 417, 418, 419, 420, 421, 422, 423, 424, 425, 426, 427, 428, 429, 430,
    431, 432, 433, 434, 435, 436, 437, 438, 439, 440, 441, 442, 443, 444, 445,
    446, 447, 448, 449, 450, 451, 452, 453, 454, 455, 456, 457, 458, 459, 460,
    461, 462, 463, 464, 465, 466, 467, 468, 469, 470, 471, 472, 473, 474, 475,
    476, 477, 478, 479, 480, 481, 482, 483, 484, 485, 486, 487, 488, 489, 490,
    491, 492, 493, 501, 502, 503, 548, 549, 550, 570, 571, 627, 628, 641, 642,
    645, 700, 704, 705, 706, 712, 713, 722, 723, 724, 899, 900, 901, 902, 903,
    904, 905
]

FIRST_FORM_ONLY_456 = [383, 382, 484, 483, 25, 172, 718]
