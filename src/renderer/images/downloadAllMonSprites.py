import json
import os
import re
import threading
import time
import urllib.request

with open('../../consts/JSON/Pokemon.json') as f:
    POKEMON_DATA = json.load(f)

def get_serebii_sprite(dex_num, form_num, is_shiny, game, is_female=False, formeOverride=None):
    
    if formeOverride == None:
        formeName = (
            POKEMON_DATA[str(dex_num)]['formes'][form_num]['sprite']
            if dex_num not in [664, 665] else POKEMON_DATA[str(dex_num)]['name'].lower()
        )
    else:
        formeName = formeOverride
    formeName = (
        formeName.replace('paldea-fire', 'b')
        .replace('paldea-water', 'a')
    )
    monName = POKEMON_DATA[str(dex_num)]['formes'][0]['sprite']
    if POKEMON_DATA[str(dex_num)]['formes'][0]['name'] != POKEMON_DATA[str(dex_num)]['name'] and formeName != "wishiwashi-school":
        monName = POKEMON_DATA[str(dex_num)]['formes'][0]['alias']

    if "alcremie" in formeName:
        print(formeName)
        formeName = formeName.split(f'alcremie-')[1]
        flavor, pattern = formeName.split('-')[:2]
        sweet = "strawberry"
        if len(formeName.split('-')) > 2:
            sweet = formeName.split('-')[2]
        formeName = ""
        if not is_shiny:
            if flavor[0] == "m" or flavor == "rainbow":
                formeName += flavor[:2] + pattern[0]
            elif flavor != "vanilla":
                formeName += flavor[0] + pattern[0]
        if sweet != "strawberry":
            formeName += sweet
        print(flavor, pattern, sweet, "->", formeName)
    elif form_num == 0:
        formeName = ""
    else:
        formeSections = formeName.split(f'{monName}-')
        if len(formeSections) > 1:
            if dex_num == 493 or "silvally" in formeName:
                formeName = formeSections[1]
            elif "genesect" in formeName:
                if "shock" in formeName:
                    formeName = "e"
                elif "burn" in formeName:
                    formeName = "f"
                elif "chill" in formeName:
                    formeName = "i"
                elif "douse" in formeName:
                    formeName = "w"
            elif "wormadam" in formeName:
                if "sandy" in formeName:
                    formeName = "c"
                elif "trash" in formeName:
                    formeName = "s"
            elif "necrozma" in formeName:
                if "dusk" in formeName:
                    formeName = "dm"
                elif "dawn" in formeName:
                    formeName = "dw"
            elif "cramorant" in formeName:
                formeName = formeSections[1][:2]
            else:
                formeName = formeSections[1][0] 
        else:
            formeName = ""

    if dex_num == 741 and form_num == 2:
        formeName = 'pau'

    gameURI = game
    if not is_shiny:
        if gameURI == "SWSH":
            gameURI = "swordshield"
        elif gameURI == "SV":
            gameURI = "scarletviolet"
    if formeName != "":
        formeName = "-" + formeName
    elif is_female and gameURI != "SWSH":
        formeName = "-f"

    if gameURI == "SWSH":
        if "silvally" in monName:
            formeName = ""
    return (
        f"https://www.serebii.net/{'Shiny/' if is_shiny else ''}"
        f"{gameURI}/{'pokemon/' if not is_shiny else ''}{'new/' if gameURI == 'SV' else ''}"
        f"{str(dex_num).zfill(3)}{formeName}.png"
    )


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
    forme_name = forme_name.replace("galar", "galarian")
    if dex_num == 555 and "zen" not in forme_name:
        forme_name += "-standard"
    if forme_name.endswith("pokeball"):
        forme_name = forme_name[:-4] + "-ball"
    elif forme_name.endswith("-alola"):
        forme_name = forme_name + "n"
    elif forme_name.endswith("-hisui"):
        forme_name = forme_name + "an"
    elif forme_name.endswith("-exclamation"):
        forme_name = forme_name[:-11] + "em"
    elif forme_name.endswith("-question"):
        forme_name = forme_name[:-8] + "qm"
    return forme_name


def get_pokemon_db_sprite(dex_num: int, form_num: int, is_shiny: bool, game: str, is_female=False, forme_name=None) -> str:
    if forme_name is None:
        forme_name = format_pokemon_db_forme(dex_num, form_num)

    female_stats = {"indeedee-f", "meowstic-f",
                    "oinkologne-f", "basculegion-f"}
    if game == "home" and forme_name in female_stats:
        forme_name += "emale"
    elif game == "bank" and forme_name.endswith("-core"):
        forme_name = forme_name[:-5]
    elif forme_name == "pikachu-partner-cap":
        forme_name = "pikachu-johto-cap"
    return f"https://img.pokemondb.net/sprites/{game}/{'normal' if not is_shiny else 'shiny'}/{forme_name}{'-female' if is_female and forme_name in female_stats else '-f' if is_female else ''}.png"

def get_pokencyclopedia_coloxd_sprite(dex_num, is_shiny, forme_name):
    return f"https://www.pokencyclopedia.info/sprites/spin-off/ani_xd{'_shiny' if is_shiny else ''}/ani_xd{'-S' if is_shiny else ''}_{str(dex_num).zfill(3)}{'-' + forme_name if forme_name != None else ''}.gif"


def download_png(url, directory, filename):
    # Check if the file already exists in the directory
    if os.path.isfile(os.path.join(directory, filename)):
        # print(f"{filename} already exists in {directory}")
        return False, False

    print(f"Downloading {filename} from {url}...")
    try:
        opener = urllib.request.build_opener()
        opener.addheaders = [('User-agent', 'Mozilla/5.0')]
        urllib.request.install_opener(opener)
        urllib.request.urlretrieve(url, os.path.join(directory, filename))
        print(f"\tDownloaded to {directory}")
        return True, False
    except Exception as e:
        print(f"\tError downloading: {e}")
        return True, "404" not in str(e)
    # print(f"{filename} from {url}")
    # return False, False


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
    10, 11, 12, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 35, 36, 37, 38, 39, 
    40, 41, 42, 46, 47, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 
    63, 64, 65, 66, 67, 68, 72, 73, 74, 75, 76, 79, 80, 81, 82, 86, 87, 88,
    89, 90, 91, 92, 93, 94, 96, 97, 102, 103, 104, 105, 108, 113, 115, 118,
      119, 120, 121,
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

swsh_transferrable = [
    1,2,3,4,5,6,7,8,9,10,11,12,25,26,27,28,29,30,31,32,
    33,34,35,36,37,38,39,40,41,42,43,44,45,50,51,52,53,54,55,58,
    59,60,61,62,63,64,65,66,67,68,72,73,77,78,79,80,81,82,83,90,
    91,92,93,94,95,98,99,102,103,104,105,106,107,108,109,110,111,112,113,114,
    115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,134,
    135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,163,164,169,
    170,171,172,173,174,175,176,177,178,182,183,184,185,186,194,195,196,197,199,202,
    206,208,211,212,213,214,215,220,221,222,223,224,225,226,227,230,233,236,237,238,
    239,240,241,242,243,244,245,246,247,248,249,250,251,252,253,254,255,256,257,258,
    259,260,263,264,270,271,272,273,274,275,278,279,280,281,282,290,291,292,293,294,
    295,298,302,303,304,305,306,309,310,315,318,319,320,321,324,328,329,330,333,334,
    337,338,339,340,341,342,343,344,345,346,347,348,349,350,355,356,359,360,361,362,
    363,364,365,369,371,372,373,374,375,376,377,378,379,380,381,382,383,384,385,403,
    404,405,406,407,415,416,420,421,422,423,425,426,427,428,434,435,436,437,438,439,
    440,442,443,444,445,446,447,448,449,450,451,452,453,454,458,459,460,461,462,463,
    464,465,466,467,468,470,471,473,474,475,477,478,479,480,481,482,483,484,485,487,
    488,494,506,507,508,509,510,517,518,519,520,521,524,525,526,527,528,529,530,531,
    532,533,534,535,536,537,538,539,543,544,545,546,547,548,549,550,551,552,553,554,
    555,556,557,558,559,560,561,562,563,564,565,566,567,568,569,570,571,572,573,574,
    575,576,577,578,579,582,583,584,587,588,589,590,591,592,593,595,596,597,598,599,
    600,601,605,606,607,608,609,610,611,612,613,614,615,616,617,618,619,620,621,622,
    623,624,625,626,627,628,629,630,631,632,633,634,635,636,637,638,639,640,641,642,
    643,644,645,646,647,649,659,660,661,662,663,674,675,677,678,679,680,681,682,683,
    684,685,686,687,688,689,690,691,692,693,694,695,696,697,698,699,700,701,702,703,
    704,705,706,707,708,709,710,711,712,713,714,715,716,717,718,719,721,722,723,724,
    725,726,727,728,729,730,736,737,738,742,743,744,745,746,747,748,749,750,751,752,
    753,754,755,756,757,758,759,760,761,762,763,764,765,766,767,768,769,770,771,772,
    773,776,777,778,780,781,782,783,784,785,786,787,788,789,790,791,792,793,794,795,
    796,797,798,799,800,801,802,803,804,805,806,807,808,809,810,811,812,813,814,815,
    816,817,818,819,820,821,822,823,824,825,826,827,828,829,830,831,832,833,834,835,
    836,837,838,839,840,841,842,843,844,845,846,847,848,849,850,851,852,853,854,855,
    856,857,858,859,860,861,862,863,864,865,866,867,868,869,870,871,872,873,874,875,
    876,877,878,879,880,881,882,883,884,885,886,887,888,889,890,891,892,893,894,895,
    896,897,898
]

legends_dex = [
    25, 26, 35, 36, 37, 38, 41, 42, 46, 47, 54, 55, 58, 59, 63, 64, 65, 66, 67,
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
    722, 723, 724, 899, 900, 901, 902, 903, 904, 905
]

sv_transferrable = [
    25, 26, 39, 40, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 79, 80, 81,
    82, 88, 89, 90, 91, 92, 93, 94, 96, 97, 100, 101, 113, 123, 128, 129, 130,
    132, 133, 134, 135, 136, 147, 148, 149, 172, 174, 179, 180, 181, 183, 184,
    185, 187, 188, 189, 191, 192, 194, 196, 197, 198, 199, 200, 203, 204, 205,
    206, 211, 212, 214, 215, 216, 217, 225, 228, 229, 231, 232, 234, 242, 246,
    247, 248, 278, 279, 280, 281, 282, 283, 284, 285, 286, 287, 288, 289, 296,
    297, 298, 302, 307, 308, 316, 317, 322, 323, 324, 325, 326, 331, 332, 333, 
    334, 335, 336, 339, 340, 353, 354, 357, 361, 362, 370, 371, 372, 373, 396, 
    397, 398, 401, 402, 403, 404, 405, 415, 416, 417, 418, 419, 422, 423, 425, 
    426, 429, 430, 434, 435, 436, 437, 438, 440, 442, 443, 444, 445, 447, 448, 
    449, 450, 456, 457, 459, 460, 461, 462, 470, 471, 475, 478, 479, 548, 549, 
    550, 551, 552, 553, 570, 571, 574, 574, 576, 585, 586, 590, 591, 594, 602, 
    603, 604, 610, 611, 612, 613, 614, 615, 624, 625, 627, 628, 633, 634, 635, 
    636, 637, 661, 662, 663, 664, 665, 666, 667, 668, 669, 670, 671, 672, 673, 
    690, 691, 692, 693, 700, 701, 702, 704, 705, 706, 707, 712, 713, 714, 715, 
    734, 735, 739, 740, 741, 744, 745, 747, 748, 749, 750, 753, 754, 757, 758, 
    761, 762, 763, 765, 766, 769, 770, 775, 778, 779, 819, 820, 821, 822, 823,
    833, 834, 837, 838, 839, 840, 841, 842, 843, 844, 846, 847, 848, 849, 854,
    855, 856, 857, 858, 859, 860, 861, 870, 871, 872, 873, 874, 875, 876, 878,
    879, 885, 886, 887, 906, 907, 908, 909, 910, 911, 912, 913, 914, 915, 916,
    917, 918, 919, 920, 921, 922, 923, 924, 925, 926, 927, 928, 929, 930, 931, 
    932, 933, 934, 935, 936, 937, 938, 939, 940, 941, 942, 943, 944, 945, 946, 
    947, 948, 949, 950, 951, 952, 953, 954, 955, 956, 957, 958, 959, 960, 961, 
    962, 963, 964, 965, 966, 967, 968, 969, 970, 971, 972, 973, 974, 975, 976,
    977, 978, 979, 980, 981, 982, 983, 984, 985, 986, 987, 988, 989, 990, 991, 
    992, 993, 994, 995, 996, 997, 998, 999, 1000, 1001, 1002, 1003, 1004, 1005, 
    1006, 1007, 1008, 1009, 1010,
    4, 5, 6, 144, 145, 146, 150, 151, 155, 156, 157, 195, 382, 383, 384, 480, 
    481, 482, 483, 484, 485, 487, 488, 493, 501, 502, 503, 641, 642, 645, 648, 
    650, 651, 652, 653, 654, 655, 656, 657, 658, 703, 719, 720, 721, 722, 723, 
    724, 801, 810, 811, 812, 813, 814, 815, 816, 817, 818, 863, 888, 889, 890, 
    891, 892, 893, 894, 895, 896, 897, 898, 899, 900, 901, 902, 903, 904, 905
]


gender_differences = [
    3, 12, 19, 20, 25, 26, 41, 42, 44, 45, 64, 65, 84, 85, 97, 111, 112, 118,
    119, 123, 129, 130, 133, 154, 165, 166, 178, 185, 186, 190, 194, 195, 198,
    202, 203, 207, 208, 212, 214, 215, 215, 217, 221, 224, 229, 232, 255, 256,
    257, 267, 269, 272, 274, 275, 307, 308, 315, 316, 317, 322, 323, 332, 350,
    369, 396, 397, 398, 399, 400, 401, 402, 403, 404, 405, 407, 415, 417, 418,
    419, 424, 443, 444, 445, 449, 450, 453, 454, 456, 457, 459, 460, 461, 464,
    465, 473, 521, 592, 593, 668]


def excludeFormeGen45(dex_number, forme):
    if "-mega" in forme["sprite"] or "-Fairy" in forme["formeName"]:
        return True
    return excludeFormeGen456(dex_number, forme)


def excludeFormeGen456(dex_number, forme):
    if (dex_number in RegionalForms and
            forme["formeNumber"] in RegionalForms[dex_number]):
        return True
    return dex_number in first_forme_only and forme["formeNumber"] != 0


def excludeFormeGen4(dex_number, forme):
    return excludeFormeGen45(dex_number, forme)


def excludeFormeGen5(dex_number, forme):
    if forme["formeName"] == "Pichu-Spiky-Eared":
        return True
    return excludeFormeGen45(dex_number, forme)


def excludeFormeGen7(dex_number, forme):
    if dex_number not in alola_dex:
        return True
    if dex_number == 25 and forme["formeNumber"] > 7:
        return True
    if forme["formeName"] == "Pichu-Spiky-Eared":
        return True
    return dex_number in Gen89RegionalForms and forme["formeNumber"] in Gen89RegionalForms[dex_number]


def excludeFormeLA(dex_number, forme):
    if dex_number not in legends_dex:
        return True
    if dex_number not in [37, 38, 215]:
        if dex_number in HisuianForms:
            if forme["formeNumber"] not in HisuianForms[dex_number]:
                return True
        elif dex_number in RegionalForms and forme["formeNumber"] != 0:
            return True
    if forme["formeName"] == "Pichu-Spiky-Eared":
        return True
    return "-Mega" in forme["formeName"] or (dex_number == 25 and forme["formeNumber"] > 0)

def exclude_forme_gen8(dex_number, forme):
    if dex_number > 493 and dex_number not in swsh_transferrable:
        return True
    if forme["formeName"] == "Pichu-Spiky-Eared":
        return True
    if dex_number in HisuianForms and forme["formeNumber"] in HisuianForms[dex_number]:
        return True
    if dex_number in PaldeanForms and forme["formeNumber"] in PaldeanForms[dex_number]:
        return True
    if dex_number in AlolanForms and forme["formeNumber"] in AlolanForms[dex_number] and dex_number not in swsh_transferrable:
        return True
    return "-Mega" in forme["formeName"] or "-Primal" in forme["formeName"] or (dex_number == 25 and forme["formeNumber"] > 0)

def exclude_forme_gen9(dex_number, forme):
    if dex_number not in sv_transferrable:
        return True
    if forme["formeName"] == "Pichu-Spiky-Eared":
        return True
    if forme["formeName"] == "Floette-Eternal":
        return True
    return "-Mega" in forme["formeName"] or "-Primal" in forme["formeName"] or (dex_number == 25 and forme["formeNumber"] > 0)


def exclude_forme_home(dex_number, forme):
    if forme["formeName"] == "Pichu-Spiky-Eared":
        return True
    if forme["formeName"] == "Floette-Eternal":
        return True
    return "regional" in forme and forme["regional"] == "Paldea"


def download_all_sprites_all_mons():
    os.makedirs("sprites/home/shiny", exist_ok=True)
    os.makedirs("sprites/gen1", exist_ok=True)
    os.makedirs("sprites/gen2/shiny", exist_ok=True)
    os.makedirs("sprites/gen3/shiny", exist_ok=True)
    os.makedirs("sprites/gen3gc/shiny", exist_ok=True)
    os.makedirs("sprites/gen4/shiny", exist_ok=True)
    os.makedirs("sprites/gen5/shiny", exist_ok=True)
    os.makedirs("sprites/gen6/shiny", exist_ok=True)
    os.makedirs("sprites/gen7/shiny", exist_ok=True)
    os.makedirs("sprites/gen8/shiny", exist_ok=True)
    os.makedirs("sprites/gen8a/shiny", exist_ok=True)
    os.makedirs("sprites/gen9/shiny", exist_ok=True)
    serebii_calls = []
    sleep_time = 1.0
    for dex_num_str, mon in POKEMON_DATA.items():
        dex_number = int(dex_num_str)
        for forme_number, forme in enumerate(mon["formes"]):
            serebii_calls += download_all_sprites(dex_number, forme, forme_number)
    retries = 4
    while len(serebii_calls) > 0:
        should_wait, should_retry = serebii_calls[0]()
        if should_retry and retries > 0:
            sleep_time += 0.5
            retries -= 1
            print("retrying...")
        else:
            retries = 4
            sleep_time = min(1.0, sleep_time)
            serebii_calls = serebii_calls[1:]
            if should_wait and sleep_time > 0.5:
                sleep_time -= 0.1
                print("sleep time:", sleep_time)

        if should_wait:
            time.sleep(sleep_time)

def download_all_sprites(dex_number, forme, forme_number):
    if dex_number != 869:
        thread = threading.Thread(target=download_non_serebii_sprites, args=(
            dex_number, forme, forme_number, forme["sprite"]))
        thread.start()
        return functions_to_download_serebii(
            dex_number, forme, forme_number, forme["sprite"])
    else:
        functions = []
        for sweet in sweets:
            thread = threading.Thread(target=download_non_serebii_sprites, args=(
                dex_number, forme, forme_number, forme["sprite"] + "-" + sweet))
            thread.start()
            functions += functions_to_download_serebii(
                dex_number, forme, forme_number, forme["sprite"] + "-" + sweet)
        return functions


def download_non_serebii_sprites(dex_number, forme, forme_number, forme_name):
    if "Totem" in forme["formeName"]:
        return
    if dex_number <= 151 and forme_number == 0:
        download_png(get_showdown_sprite(dex_number, forme_number,
                     False, "gen1"), "sprites/gen1", forme_name + ".png")
    if dex_number <= 251 and forme_number == 0 or dex_number == 201 and forme_number <= 25:
        download_sprite_variants_pokemon_db(
            dex_number, forme_number, forme_name, "crystal", "gen2", False)
    if dex_number <= 386 and forme_number == 0 or dex_number == 201 or dex_number == 386:
        download_sprite_variants_pokemon_db(
            dex_number, forme_number, forme_name, "emerald", "gen3", False)
        download_sprite_variants_pokencyclopedia_coloxd(dex_number, forme_number, forme_name)
    if dex_number <= 493 and not excludeFormeGen4(dex_number, forme):
        download_sprite_variants_pokemon_db(
            dex_number, forme_number, forme_name, 
            "heartgold-soulsilver", "gen4", dex_number != 133 and dex_number != 419)
    if dex_number <= 649 and not excludeFormeGen5(dex_number, forme):
        download_png(get_showdown_sprite(dex_number, forme_number, False,
                     "gen5ani"), "sprites/gen5", forme_name + ".gif")
        download_png(get_showdown_sprite(dex_number, forme_number, True,
                     "gen5ani"), "sprites/gen5/shiny", forme_name + ".gif")
        if dex_number in gender_differences and forme_number == 0 and dex_number != 133 and dex_number != 255 and dex_number != 418:
            download_png(get_showdown_sprite(dex_number, forme_number, False,
                         "gen5ani", is_female=True), "sprites/gen5", forme_name + "-f.gif")
            download_png(get_showdown_sprite(dex_number, forme_number, False,
                         "gen5ani", is_female=True), "sprites/gen5", forme_name + "-f.gif")
    if dex_number <= 721 and not excludeFormeGen456(dex_number, forme):
        download_sprite_variants_pokemon_db(
            dex_number, forme_number, forme_name, "bank", "gen6", dex_number != 133)
    if dex_number == 774:
        download_sprite_variants_pokemon_db(
            dex_number, forme_number, forme_name, "sun-moon", "gen7")
    elif dex_number <= 809 and not excludeFormeGen7(dex_number, forme):
        download_sprite_variants_pokemon_db(
            dex_number, forme_number, forme_name, "ultra-sun-ultra-moon", "gen7", dex_number != 133)
    if dex_number <= 905 and not exclude_forme_home(dex_number, forme):
        download_sprite_variants_pokemon_db(
            dex_number, forme_number, forme_name, "home", "home")
    if dex_number <= 724 and not excludeFormeLA(dex_number, forme):
        download_sprite_variants_pokemon_db(
            dex_number, forme_number, forme_name, "legends-arceus", "gen8a")

def functions_to_download_serebii(dex_number, forme, forme_number, forme_name):
    functions = []
    if dex_number <= 1010 and not exclude_forme_gen9(dex_number, forme):
        functions += download_sprite_variants_serebii(
            dex_number, forme_number, forme_name, "SV", "gen9")
    if dex_number <= 1010 and not exclude_forme_gen8(dex_number, forme):
        if (dex_number == 19):
            print("adding rattata")
            print(exclude_forme_gen9(dex_number, forme), exclude_forme_gen8(dex_number, forme))
        functions += download_sprite_variants_serebii(
            dex_number, forme_number, forme_name, "SWSH", "gen8", dex_number in swsh_transferrable)
    return functions

def download_sprite_variants_pokemon_db(dex_number, forme_number, forme_name, game, folder, includeFemale=True):
    if "-totem" in forme_name:
        return
    download_png(get_pokemon_db_sprite(dex_number, forme_number, False,
                                       game), "sprites/" + folder, forme_name + ".png")
    download_png(get_pokemon_db_sprite(dex_number, forme_number, True,
                                       game), "sprites/" + folder + "/shiny", forme_name + ".png")
    if includeFemale and dex_number in gender_differences and forme_number == 0 and dex_number != 255 and dex_number != 418:
        download_png(get_pokemon_db_sprite(dex_number, forme_number, False,
                                           game, is_female=True), "sprites/" + folder, forme_name + "-f.png")
        download_png(get_pokemon_db_sprite(dex_number, forme_number, True,
                                           game, is_female=True), "sprites/" + folder + "/shiny", forme_name + "-f.png")

def download_sprite_variants_pokencyclopedia_coloxd(dex_number, forme_number, forme_name):
    gen3_forme = None
    if forme_number > 0 or dex_number == 201:
        gen3_forme = forme_name.split('-')[1]
    download_png(get_pokencyclopedia_coloxd_sprite(dex_number, False, gen3_forme), "sprites/gen3gc", forme_name + ".gif")
    download_png(get_pokencyclopedia_coloxd_sprite(dex_number, True, gen3_forme), "sprites/gen3gc/shiny", forme_name + ".gif")

def download_sprite_variants_serebii(dex_number, forme_number, forme_name, game, folder, includeFemale=True):
    functions = []
    if "-totem" in forme_name:
        return
    functions.append(lambda : download_png(get_serebii_sprite(dex_number, forme_number, False,
                                    game, formeOverride=forme_name), "sprites/" + folder, forme_name + ".png"))
    functions.append(lambda : download_png(get_serebii_sprite(dex_number, forme_number, True,
                                       game, formeOverride=forme_name), "sprites/" + folder + "/shiny", forme_name + ".png"))
    if includeFemale and dex_number in gender_differences and forme_number == 0 and dex_number != 255 and dex_number != 418:
        functions.append(lambda : download_png(get_serebii_sprite(dex_number, forme_number, False,
                                           game, is_female=True, formeOverride=forme_name), "sprites/" + folder, forme_name + "-f.png"))
        functions.append(lambda : download_png(get_serebii_sprite(dex_number, forme_number, True,
                                           game, is_female=True, formeOverride=forme_name), "sprites/" + folder + "/shiny", forme_name + "-f.png"))
    return functions
    # if dex_number <= 809:
    #     print("This Pokemon was present in Generation VII.")


download_all_sprites_all_mons()
# print(POKEMON_DATA["19"]["formes"][1])
# print(exclude_forme_gen8(19, POKEMON_DATA["19"]["formes"][1]))
