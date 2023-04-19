import json
import os
import re
import threading

import urllib.request


with open('../../consts/JSON/Pokemon.json') as f:
    POKEMON_DATA = json.load(f)


def get_showdown_sprite(dex_num: int, form_num: int, is_shiny: bool, game: str, is_female=False) -> str:
    if dex_num < 1 or dex_num > 1010:
        return ""
    forme_name = (
        POKEMON_DATA[str(dex_num)]["formes"][form_num]["sprite"]
    )
    if forme_name.endswith("-west"):
        forme_name = forme_name[:-5]
    elif forme_name == "basculin-red-striped":
        forme_name = "basculin"
    return f"https://play.pokemonshowdown.com/sprites/{game}{'-shiny' if is_shiny else ''}/{forme_name}.gif" if "ani" in game else f"https://play.pokemonshowdown.com/sprites/{game}{'-shiny' if is_shiny else ''}/{forme_name}{'-f' if is_female else ''}.{'gif' if 'ani' in game else 'png'}"


def format_pokemon_db_forme(dex_num: int, form_num: int) -> str:
    if dex_num < 1 or dex_num > 1010:
        return ""
    forme_name = (
        POKEMON_DATA[str(dex_num)]["formes"][form_num]["sprite"]
    )
    if "-core" in forme_name:
        pattern = r"^(.*)-core-(\w+)$"
        match = re.match(pattern, forme_name)

        if match:
            forme_name = f"{match.group(1)}-{match.group(2)}-core"
    if forme_name.endswith("pokeball"):
        forme_name = forme_name[:-4] + "-ball"
    elif forme_name.endswith("-alola"):
        forme_name = forme_name + "n"
    elif forme_name.endswith("-galar"):
        forme_name = forme_name + "ian"
    elif forme_name.endswith("-hisui"):
        forme_name = forme_name + "an"
    elif forme_name.endswith("-exclamation"):
        forme_name = forme_name[:-11] + "em"
    elif forme_name.endswith("-question"):
        forme_name = forme_name[:-8] + "qm"
    return forme_name


def get_pokemon_db_sprite(dex_num: int, form_num: int, is_shiny: bool, game: str, is_female=False, forme_name=None) -> str:
    if forme_name == None:
        forme_name = format_pokemon_db_forme(dex_num, form_num)

    female_stats = {"indeedee-f", "meowstic-f",
                    "oinkologne-f", "basculegion-f"}
    if game == "home" and forme_name in female_stats:
        forme_name += "emale"
    elif game == "bank" and forme_name.endswith("-core"):
        forme_name = forme_name[:-5]
    elif game != "ultra-sun-ultra-moon" and forme_name == "basculin-red-striped":
        forme_name = "basculin-red"
    return f"https://img.pokemondb.net/sprites/{game}/{'normal' if not is_shiny else 'shiny'}/{forme_name}{'-female' if is_female and forme_name in female_stats else '-f' if is_female else ''}.png"


def download_png(url, directory, filename):
    # Check if the file already exists in the directory
    if os.path.isfile(os.path.join(directory, filename)):
        # print(f"{filename} already exists in {directory}")
        return

    try:
        opener = urllib.request.build_opener()
        opener.addheaders = [('User-agent', 'Mozilla/5.0')]
        urllib.request.install_opener(opener)
        urllib.request.urlretrieve(url, os.path.join(directory, filename))
        print(f"Downloaded {filename} to {directory}")
    except Exception as e:
        print(f"Error downloading {filename} from {url}. Exception: {e}")


CapPikachus = {
    25: [1, 2, 3, 4, 5, 6, 7, 9],
}

AlolanForms = {
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

GalarianForms = {
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

HisuianForms = {
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

PaldeanForms = {
    128: [1, 2, 3],
    194: [1],
}

TransferLockedForms = {
    25: [8],
    133: [1],
    646: [1, 2],
    800: [1, 2],
    898: [1, 2],
}

LegendsArceusExcludedForms = {
    **AlolanForms,
    **GalarianForms,
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

Gen89RegionalForms = {
    **GalarianForms,
    **HisuianForms,
    **PaldeanForms
}

RegionalForms = {
    **Gen89RegionalForms,
    **AlolanForms,
    # combine meowth form lists
    52: [1, 2]
}

first_forme_only = [
    383,
    382,
    484,
    483,
    25,
    172,
    718
]

sweets = [
    "strawberry",
    "berry",
    "love",
    "star",
    "clover",
    "flower",
    "ribbon",
]

alola_dex = [
    10, 11, 12, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 35, 36, 37, 38, 39, 40,
    41, 42, 46, 47, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64,
    65, 66, 67, 68, 72, 73, 74, 75, 76, 79, 80, 81, 82, 86, 87, 88, 89, 90, 91,
    92, 93, 94, 96, 97, 102, 103, 104, 105, 108, 113, 115, 118, 119, 120, 121,
    122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136,
    137, 138, 139, 140, 141, 142, 143, 147, 148, 149, 163, 164, 165, 166, 167,
    168, 169, 170, 171, 172, 173, 174, 177, 178, 179, 180, 181, 185, 186, 190,
    196, 197, 198, 199, 200, 204, 205, 206, 209, 210, 212, 214, 215, 222, 223,
    224, 225, 226, 227, 228, 229, 233, 235, 238, 239, 240, 241, 242, 246, 247,
    248, 278, 279, 283, 284, 296, 297, 299, 302, 303, 309, 310, 318, 319, 320,
    321, 324, 327, 328, 329, 330, 339, 340, 341, 342, 343, 344, 345, 346, 347,
    348, 349, 350, 351, 352, 353, 354, 357, 359, 361, 362, 366, 367, 368, 369,
    370, 371, 372, 373, 374, 375, 376, 408, 409, 410, 411, 422, 423, 424, 425,
    426, 427, 428, 429, 430, 438, 439, 440, 443, 444, 445, 446, 447, 448, 456,
    457, 458, 461, 462, 463, 466, 467, 470, 471, 474, 476, 478, 506, 507, 508,
    524, 525, 526, 546, 547, 548, 549, 550, 551, 552, 553, 559, 560, 564, 565,
    566, 567, 568, 569, 570, 571, 572, 573, 582, 583, 584, 587, 592, 593, 594,
    605, 606, 619, 620, 621, 622, 623, 624, 625, 627, 628, 629, 630, 636, 637,
    661, 662, 663, 667, 668, 669, 670, 671, 674, 675, 676, 686, 687, 690, 691,
    692, 693, 696, 697, 698, 699, 700, 701, 702, 703, 704, 705, 706, 707, 708,
    709, 714, 715, 718, 722, 723, 724, 725, 726, 727, 728, 729, 730, 731, 732,
    733, 734, 735, 736, 737, 738, 739, 740, 741, 742, 743, 744, 745, 746, 747,
    748, 749, 750, 751, 752, 753, 754, 755, 756, 757, 758, 759, 760, 761, 762,
    763, 764, 765, 766, 767, 768, 769, 770, 771, 772, 773, 774, 775, 776, 777,
    778, 779, 780, 781, 782, 783, 784, 785, 786, 787, 788, 789, 790, 791, 792,
    793, 794, 795, 796, 797, 798, 799, 800, 801, 802, 803, 804, 805, 806, 807,
]

legends_dex = [25, 26, 35, 36, 37, 38, 41, 42, 46, 47, 54, 55, 58, 59, 63, 64, 65, 66, 67,
               68, 72, 73, 74, 75, 76, 77, 78, 81, 82, 92, 93, 94, 95, 100, 101, 108, 111,
               112, 113, 114, 122, 123, 125, 126, 129, 130, 133, 134, 135, 136, 137, 143,
               155, 156, 157, 169, 172, 173, 175, 176, 185, 190, 193, 196, 197, 198, 200,
               201, 207, 208, 211, 212, 214, 215, 216, 217, 220, 221, 223, 224, 226, 233,
               234, 239, 240, 242, 265, 266, 267, 268, 269, 280, 281, 282, 299, 339, 340,
               315, 355, 356, 358, 361, 362, 363, 364, 365, 387, 388, 389, 390, 391, 392,
               393, 394, 395, 396, 397, 398, 399, 400, 401, 402, 403, 404, 405, 406, 407,
               408, 409, 410, 411, 412, 413, 414, 415, 416, 417, 418, 419, 420, 421, 422,
               423, 424, 425, 426, 427, 428, 429, 430, 431, 432, 433, 434, 435, 436, 437,
               438, 439, 440, 441, 442, 443, 444, 445, 446, 447, 448, 449, 450, 451, 452,
               453, 454, 455, 456, 457, 458, 459, 460, 461, 462, 463, 464, 465, 466, 467,
               468, 469, 470, 471, 472, 473, 474, 475, 476, 477, 478, 479, 480, 481, 482,
               483, 484, 485, 486, 487, 488, 489, 490, 491, 492, 493, 501, 502, 503, 548,
               549, 550, 570, 571, 627, 628, 641, 642, 645, 700, 704, 705, 706, 712, 713,
               722, 723, 724, 899, 900, 901, 902, 903, 904, 905]


gender_differences = [
    3, 12, 19, 20, 25, 26, 41, 42, 44, 45, 64, 65, 84, 85, 97, 111, 112, 118,
    119, 123, 129, 130, 133, 154, 165, 166, 178, 185, 186, 190, 194, 195, 198,
    202, 203, 207, 208, 212, 214, 215, 215, 217, 221, 224, 229, 232, 255, 256,
    257, 267, 269, 272, 274, 275, 307, 308, 315, 316, 317, 322, 323, 332, 350,
    369, 396, 397, 398, 399, 400, 401, 402, 403, 404, 405, 407, 415, 417, 418,
    419, 424, 443, 444, 445, 449, 450, 453, 454, 456, 457, 459, 460, 461, 464,
    465, 473, 521, 592, 593, 668]


def download_all_sprites_all_mons():
    os.makedirs("sprites/home/shiny", exist_ok=True)
    os.makedirs("sprites/gen1", exist_ok=True)
    os.makedirs("sprites/gen2/shiny", exist_ok=True)
    os.makedirs("sprites/gen3/shiny", exist_ok=True)
    os.makedirs("sprites/gen4/shiny", exist_ok=True)
    os.makedirs("sprites/gen5/shiny", exist_ok=True)
    os.makedirs("sprites/gen6/shiny", exist_ok=True)
    os.makedirs("sprites/gen7/shiny", exist_ok=True)
    os.makedirs("sprites/gen8/shiny", exist_ok=True)
    os.makedirs("sprites/gen8a/shiny", exist_ok=True)
    os.makedirs("sprites/gen9/shiny", exist_ok=True)
    threads = []
    for dex_num_str, mon in POKEMON_DATA.items():
        dex_number = int(dex_num_str)
        for forme_number, forme in enumerate(mon["formes"]):
            if dex_number != 869:
                thread = threading.Thread(target=download_all_sprites, args=(
                    dex_number, forme, forme_number, forme["sprite"]))
                thread.start()
                threads.append(thread)
            else:
                for sweet in sweets:
                    thread = threading.Thread(target=download_all_sprites, args=(
                        dex_number, forme, forme_number, forme["sprite"] + "-" + sweet))
                    thread.start()
                    threads.append(thread)


def download_all_sprites(dex_number, forme, forme_number, forme_name):
    if dex_number <= 151 and forme_number == 0:
        download_png(get_showdown_sprite(dex_number, forme_number,
                     False, "gen1"), "sprites/gen1", forme_name + ".png")
    if dex_number <= 251 and forme_number == 0 or dex_number == 201 and forme_number <= 25:
        download_png(get_pokemon_db_sprite(dex_number, forme_number,
                     False, "crystal"), "sprites/gen2", forme_name + ".png")
        download_png(get_pokemon_db_sprite(dex_number, forme_number, True,
                     "crystal"), "sprites/gen2/shiny", forme_name + ".png")
    if dex_number <= 386 and forme_number == 0 or dex_number == 201 or dex_number == 386:
        download_png(get_pokemon_db_sprite(dex_number, forme_number,
                     False, "emerald"), "sprites/gen3", forme_name + ".png")
        download_png(get_pokemon_db_sprite(dex_number, forme_number, True,
                     "emerald"), "sprites/gen3/shiny", forme_name + ".png")
    if dex_number <= 493 and (dex_number not in RegionalForms or
                              forme_number not in RegionalForms[dex_number]) and "-mega" not in forme["sprite"] and "-Totem" not in forme["formeName"] and "-Fairy" not in forme["formeName"] and (dex_number not in first_forme_only or forme_number == 0):
        download_png(get_pokemon_db_sprite(dex_number, forme_number, False,
                     "heartgold-soulsilver"), "sprites/gen4", forme_name + ".png")
        download_png(get_pokemon_db_sprite(dex_number, forme_number, True,
                     "heartgold-soulsilver"), "sprites/gen4/shiny", forme_name + ".png")
        if dex_number in gender_differences and forme_number == 0 and dex_number != 133 and dex_number != 255 and dex_number != 418:
            download_png(get_pokemon_db_sprite(dex_number, forme_number, False,
                         "heartgold-soulsilver", is_female=True), "sprites/gen4", forme_name + "-f.png")
            download_png(get_pokemon_db_sprite(dex_number, forme_number, False,
                         "heartgold-soulsilver", is_female=True), "sprites/gen4", forme_name + "-f.png")
    if dex_number <= 649 and (dex_number not in RegionalForms or
                              forme_number not in RegionalForms[dex_number]) and "-mega" not in forme["sprite"] and "-Totem" not in forme["formeName"] and "-Fairy" not in forme["formeName"] and (dex_number not in first_forme_only or forme_number == 0):
        download_png(get_showdown_sprite(dex_number, forme_number, False,
                     "gen5ani"), "sprites/gen5", forme_name + ".gif")
        download_png(get_showdown_sprite(dex_number, forme_number, True,
                     "gen5ani"), "sprites/gen5/shiny", forme_name + ".gif")
        if dex_number in gender_differences and forme_number == 0 and dex_number != 133 and dex_number != 255 and dex_number != 418:
            download_png(get_showdown_sprite(dex_number, forme_number, False,
                         "gen5ani", is_female=True), "sprites/gen5", forme_name + "-f.gif")
            download_png(get_showdown_sprite(dex_number, forme_number, False,
                         "gen5ani", is_female=True), "sprites/gen5", forme_name + "-f.gif")
    if dex_number <= 721 and (dex_number not in RegionalForms or
                              forme_number not in RegionalForms[dex_number]) and "-Totem" not in forme["formeName"] and (dex_number not in first_forme_only or forme_number == 0):
        download_png(get_pokemon_db_sprite(dex_number, forme_number, False,
                     "bank"), "sprites/gen6", forme_name + ".png")
        download_png(get_pokemon_db_sprite(dex_number, forme_number, True,
                     "bank"), "sprites/gen6/shiny", forme_name + ".png")
        if dex_number in gender_differences and forme_number == 0 and dex_number != 133 and dex_number != 255 and dex_number != 418:
            download_png(get_pokemon_db_sprite(dex_number, forme_number, False,
                         "bank", is_female=True), "sprites/gen6", forme_name + "-f.png")
            download_png(get_pokemon_db_sprite(dex_number, forme_number, False,
                         "bank", is_female=True), "sprites/gen6", forme_name + "-f.png")

    if dex_number == 774:
        download_png(get_pokemon_db_sprite(dex_number, forme_number, False,
                                           "sun-moon"), "sprites/gen7", forme_name + ".png")
        download_png(get_pokemon_db_sprite(dex_number, forme_number, True,
                                           "bank"), "sprites/gen7/shiny", forme_name + ".png")
    elif dex_number <= 809 and dex_number in alola_dex and (dex_number not in Gen89RegionalForms or
                                                            forme_number not in Gen89RegionalForms[dex_number]) and "-Totem" not in forme["formeName"] and "-Fairy" not in forme["formeName"] and (dex_number not in first_forme_only or forme_number == 0):
        download_png(get_pokemon_db_sprite(dex_number, forme_number, False,
                                           "ultra-sun-ultra-moon"), "sprites/gen7", forme_name + ".png")
        download_png(get_pokemon_db_sprite(dex_number, forme_number, True,
                                           "ultra-sun-ultra-moon"), "sprites/gen7/shiny", forme_name + ".png")
        if dex_number in gender_differences and forme_number == 0 and dex_number != 133 and dex_number != 255 and dex_number != 418:
            download_png(get_pokemon_db_sprite(dex_number, forme_number, False,
                                               "ultra-sun-ultra-moon", is_female=True), "sprites/gen7", forme_name + "-f.png")
            download_png(get_pokemon_db_sprite(dex_number, forme_number, False,
                                               "ultra-sun-ultra-moon", is_female=True), "sprites/gen7", forme_name + "-f.png")
    if dex_number <= 905 and "-Totem" not in forme["formeName"]:
        download_png(get_pokemon_db_sprite(dex_number, forme_number, False,
                     "home", forme_name=forme_name), "sprites/home", forme_name + ".png")
        download_png(get_pokemon_db_sprite(dex_number, forme_number, True,
                     "home", forme_name=forme_name), "sprites/home/shiny", forme_name + ".png")
        if dex_number in gender_differences and forme_number == 0 and dex_number != 133 and dex_number != 255 and dex_number != 418:
            download_png(get_pokemon_db_sprite(dex_number, forme_number, False,
                         "home", is_female=True), "sprites/home", forme_name + "-f.png")
            download_png(get_pokemon_db_sprite(dex_number, forme_number, False,
                         "home", is_female=True), "sprites/home", forme_name + "-f.png")
    if dex_number <= 724 and dex_number in legends_dex and (dex_number not in RegionalForms or (dex_number in HisuianForms and
                                                                                                forme_number in HisuianForms[dex_number]) or dex_number in [37, 38, 215]) and "-Totem" not in forme["formeName"] and "-Mega" not in forme["formeName"] and (dex_number != 25 or forme_number == 0):
        download_png(get_pokemon_db_sprite(dex_number, forme_number, False,
                                           "legends-arceus"), "sprites/gen8a", forme_name + ".png")
        download_png(get_pokemon_db_sprite(dex_number, forme_number, True,
                                           "legends-arceus"), "sprites/gen8a/shiny", forme_name + ".png")
        if dex_number in gender_differences and forme_number == 0 and dex_number != 255 and dex_number != 418:
            download_png(get_pokemon_db_sprite(dex_number, forme_number, False,
                                               "legends-arceus", is_female=True), "sprites/gen8a", forme_name + "-f.png")
            download_png(get_pokemon_db_sprite(dex_number, forme_number, False,
                                               "legends-arceus", is_female=True), "sprites/gen8a", forme_name + "-f.png")

    # if dex_number <= 809:
    #     print("This Pokemon was present in Generation VII.")


download_all_sprites_all_mons()
