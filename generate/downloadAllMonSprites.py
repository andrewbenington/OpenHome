import json
import os
import re
import sqlite3
import threading
import urllib.request
import database
from models import PokemonForm, SpeciesWithForms

if not os.path.isdir('public'):
    print("current directory must be project source. exiting")
    exit(1)

POKEMON_DATA: list[SpeciesWithForms] = []

with sqlite3.connect("generate/pkm.db") as conn:
    POKEMON_DATA = database.get_species(conn)


def download_all_sprites_all_mons():
    os.makedirs("public/sprites/home/shiny", exist_ok=True)
    os.makedirs("public/sprites/gen1", exist_ok=True)
    os.makedirs("public/sprites/gen2/shiny", exist_ok=True)
    os.makedirs("public/sprites/gen3/shiny", exist_ok=True)
    os.makedirs("public/sprites/gen3gc/shiny", exist_ok=True)
    os.makedirs("public/sprites/gen4/shiny", exist_ok=True)
    # os.makedirs("public/sprites/gen5/shiny", exist_ok=True)
    # os.makedirs("public/sprites/gen6/shiny", exist_ok=True)
    # os.makedirs("public/sprites/gen7/shiny", exist_ok=True)
    # os.makedirs("public/sprites/gen8/shiny", exist_ok=True)
    # os.makedirs("public/sprites/gen8a/shiny", exist_ok=True)
    os.makedirs("public/sprites/gen9/shiny", exist_ok=True)
    os.makedirs("public/sprites/gen9za/shiny", exist_ok=True)
    for mon in POKEMON_DATA[:37]:
        for form in mon.forms:
            if form.form_index >= len(mon.forms):
                print(f"{form.name} INVALID INDEX: {len(mon.forms)} ({len(mon.forms)} present)")
            thread_all_sprite_downloads(form)

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
        print(f"\tDownloaded {filename} to {directory}")
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

first_form_only = [
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

legends_arceus_dex = [
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
    481, 482, 483, 484, 485, 487, 488, 492, 493, 501, 502, 503, 641, 642, 645, 648,
    650, 651, 652, 653, 654, 655, 656, 657, 658, 703, 719, 720, 721, 722, 723,
    724, 801, 810, 811, 812, 813, 814, 815, 816, 817, 818, 863, 888, 889, 890,
    891, 892, 893, 894, 895, 896, 897, 898, 899, 900, 901, 902, 903, 904, 905,
    23,24,27,28,35,36,37,38,60,61,62,69,70,71,74,75,76,109,110,143,161,162,163,
    164,173,190,193,207,218,219,220,221,261,262,270,271,272,273,274,275,299,341,
    313,314,342,349,350,355,356,358,387,388,389,390,391,392,393,394,395,424,433,
    446,469,472,473,477,532,533,534,540,541,542,580,581,607,608,609,619,620,629,
    630,708,709,736,737,738,742,742,782,783,784,845,1011,1012,1013,1014,1015,1016,
    1017, 1018, 1019, 1020, 1021, 1022, 1023, 1024, 1025, 1026, 1, 2, 3, 7, 8, 9, 43, 44, 45, 72, 73, 84, 85, 86, 87, 102,
    103, 106, 107, 111, 112, 116, 117, 125, 126, 131, 137, 152, 153, 154, 158, 159, 160, 170, 171,
    182, 209, 210, 227, 230, 233, 235, 236, 237, 239, 240, 243, 244, 245, 249, 250, 252, 253, 254,
    255, 256, 257, 258, 259, 260, 311, 312, 328, 329, 330, 374, 375, 376, 377, 378, 379, 380, 381,
    386, 408, 409, 410, 411, 464, 466, 467, 474, 486, 495, 496, 497, 498, 499, 500, 522, 523, 529,
    530, 546, 547, 559, 560, 572, 573, 577, 578, 579, 595, 596, 622, 623, 638, 639, 640, 643, 644,
    646, 647, 677, 678, 686, 687, 725, 726, 727, 728, 729, 730, 731, 732, 733, 751, 752, 764, 774,
    789, 790, 791, 792, 800, 868, 869, 884,
]

legends_za_transferrable = [152, 153, 154, 498, 499, 500, 158, 159, 160, 661, 662, 663, 659, 660, 664, 665, 666, 13, 14, 15,
    16, 17, 18, 179, 180, 181, 504, 505, 406, 315, 407, 129, 130, 688, 689, 120, 121, 669, 670, 671,
    672, 673, 677, 678, 667, 668, 674, 675, 568, 569, 702, 172, 25, 26, 173, 35, 36, 167, 168, 23,
    24, 63, 64, 65, 92, 93, 94, 543, 544, 545, 679, 680, 681, 69, 70, 71, 511, 512, 513, 514, 515,
    516, 307, 308, 309, 310, 280, 281, 282, 475, 228, 229, 333, 334, 531, 682, 683, 684, 685, 133,
    134, 135, 136, 196, 197, 470, 471, 700, 427, 428, 353, 354, 582, 583, 584, 322, 323, 449, 450,
    529, 530, 551, 552, 553, 66, 67, 68, 443, 444, 445, 703, 302, 303, 359, 447, 448, 79, 80, 199,
    318, 319, 602, 603, 604, 147, 148, 149, 1, 2, 3, 4, 5, 6, 7, 8, 9, 618, 676, 686, 687, 690, 691,
    692, 693, 704, 705, 706, 225, 361, 362, 478, 459, 460, 712, 713, 123, 212, 127, 214, 587, 701,
    708, 709, 559, 560, 714, 715, 707, 607, 608, 609, 142, 696, 697, 698, 699, 95, 208, 304, 305,
    306, 694, 695, 710, 711, 246, 247, 248, 656, 657, 658, 870, 650, 651, 652, 227, 653, 654, 655,
    371, 372, 373, 115, 780, 374, 375, 376, 716, 717, 718, 719, 150,56, 57, 979, 52, 53, 863, 83, 865, 104, 105, 137, 233, 474, 951, 952, 957, 958, 959, 967, 969,
    970, 479, 971, 972, 769, 770, 352, 973, 615, 977, 978, 996, 997, 998, 999, 1000, 211, 904, 252,
    253, 254, 255, 256, 257, 258, 259, 260, 349, 350, 433, 358, 876, 509, 510, 517, 518, 538, 539,
    562, 563, 867, 767, 768, 827, 828, 852, 853, 778, 900, 877, 622, 623, 821, 822, 823, 174, 39,
    40, 926, 927, 396, 397, 398, 325, 326, 931, 739, 740, 932, 933, 934, 316, 317, 41, 42, 169, 935,
    936, 937, 942, 943, 848, 849, 944, 945, 335, 336, 439, 122, 866, 590, 591, 485, 721, 638, 639,
    640, 647, 648, 649, 720, 802, 808, 809, 491, 380, 381, 382, 383, 384, 801, 807]

z_megas = [359, 445, 448]
mega_z_form_index = 2


gender_differences = [
    3, 12, 19, 20, 25, 26, 41, 42, 44, 45, 64, 65, 84, 85, 97, 111, 112, 118,
    119, 123, 129, 130, 133, 154, 165, 166, 178, 185, 186, 190, 194, 195, 198,
    202, 203, 207, 208, 212, 214, 215, 215, 217, 221, 224, 229, 232, 255, 256,
    257, 267, 269, 272, 274, 275, 307, 308, 315, 316, 317, 322, 323, 332, 350,
    369, 396, 397, 398, 399, 400, 401, 402, 403, 404, 405, 407, 415, 417, 418,
    419, 424, 443, 444, 445, 449, 450, 453, 454, 456, 457, 459, 460, 461, 464,
    465, 473, 521, 592, 593, 668]


# def excludeFormGen45(form: PokemonForm):
#     if "-mega" in form.sprite_name or "-Fairy" in form.name:
#         return True
#     return excludeFormGen456(dex_number, form)


# def excludeFormGen456(form: PokemonForm):
#     if (dex_number in RegionalForms and
#             form.form_index in RegionalForms[dex_number]):
#         return True
#     return dex_number in first_form_only and form.form_index != 0


# def excludeFormGen4(form: PokemonForm):
#     return excludeFormGen45(dex_number, form)


# def excludeFormGen5(form: PokemonForm):
#     if form.name == "Pichu-Spiky-Eared":
#         return True
#     return excludeFormGen45(dex_number, form)

# def exclude_form_gen8(form: PokemonForm):
#     if dex_number > 493 and dex_number not in swsh_transferrable:
#         return True
#     if form.name == "Pichu-Spiky-Eared":
#         return True
#     if dex_number in HisuianForms and form.form_index in HisuianForms[dex_number]:
#         return True
#     if dex_number in PaldeanForms and form.form_index in PaldeanForms[dex_number]:
#         return True
#     if dex_number in AlolanForms and form.form_index in AlolanForms[dex_number] and dex_number not in swsh_transferrable:
#         return True
#     return "-Mega" in form.name or "-Primal" in form.name or (dex_number == 25 and form.form_index > 0)


def exclude_form_home(form: PokemonForm):
    if form.name == "Pichu-Spiky-Eared":
        return True
    if form.name == "Floette-Eternal":
        return True
    return form.regional == "Paldea"

def thread_all_sprite_downloads(form: PokemonForm):
    def executer():
        download_all_sprites(form)
    thread = threading.Thread(target=executer)
    thread.start()
    


def download_all_sprites(form: PokemonForm):
    if "Totem" in form.name:
        return
    if form.national_dex <= 151 and form.form_index == 0:
        download_sprite_variants_pokemon_db(form, "red-blue", "gen1", False)
    if form.national_dex <= 251 and form.form_index == 0 or form.national_dex == 201 and form.form_index <= 25:
        download_sprite_variants_pokemon_db(form, "crystal", "gen2", False)
    if form.national_dex <= 386 and form.form_index == 0 or form.national_dex == 201 or form.national_dex == 386:
        download_sprite_variants_pokemon_db(form, "emerald", "gen3", False)
        download_sprite_variants_pokencyclopedia_coloxd(form)
    if form.national_dex <= 493 and form.has_gen4_sprite():
        download_sprite_variants_pokemon_db(form, "heartgold-soulsilver", "gen4", form.national_dex != 133 and form.national_dex != 419)
    # if form.national_dex <= 649 and not excludeFormGen5(form):
    #     download_sprite_variants_pokemon_db(form, "black-white/anim", "gen5", form.national_dex != 133)
    # if form.national_dex <= 721 and not excludeFormGen456(form: PokemonForm):
    #     download_sprite_variants_pokemon_db(form, "bank", "gen6", form.national_dex != 133)
    # if form.national_dex == 774:
    #     download_sprite_variants_pokemon_db(form, "sun-moon", "gen7")
    # elif form.national_dex <= 809 and not excludeFormGen7(form: PokemonForm):
    #     download_sprite_variants_pokemon_db(
    #         form.national_dex, form.form_index, form_name, "ultra-sun-ultra-moon", "gen7", form.national_dex != 133)
    if form.national_dex <= 1025 and form.has_home_sprite():
        download_sprite_variants_pokemon_db(form, "home", "home")
    # if dex_number <= 724 and not excludeFormLA(form: PokemonForm):
    #     download_sprite_variants_pokemon_db(
    #         dex_number, form.form_index, form_name, "legends-arceus", "gen8a")
    if form.national_dex <= 1025 and form.has_scarlet_violet_sprite():
        download_sprite_variants_pokemon_db(form,  "scarlet-violet", "gen9")

def download_sprite_variants_pokemon_db(form: PokemonForm, game, folder, includeFemale=True):
    if "-totem" in form.name:
        return
    
    extension = ".gif" if "anim" in game else ".png"

    for sprite_name in form.variant_sprite_names():
        download_png(form.pokemon_db_sprite_url(False, game, False), "public/sprites/" + folder, sprite_name + extension)
        
        if game == "red-blue" or game == 'scarlet-violet':
            continue

        download_png(form.pokemon_db_sprite_url(True, game, False), "public/sprites/" + folder + "/shiny", sprite_name + extension)
        if includeFemale and form.national_dex in gender_differences and form.form_index == 0 and form.national_dex != 255 and form.national_dex != 418:
            download_png(form.pokemon_db_sprite_url(False, game, is_female=True), "public/sprites/" + folder, sprite_name + "-f" + extension)
            download_png(form.pokemon_db_sprite_url(True, game, is_female=True), "public/sprites/" + folder + "/shiny", sprite_name + "-f" + extension)

def download_sprite_variants_pokencyclopedia_coloxd(form: PokemonForm):
    download_png(form.colo_xd_sprite_url(False), "public/sprites/gen3gc", form.name + ".gif")
    download_png(form.colo_xd_sprite_url(True), "public/sprites/gen3gc/shiny", form.name + ".gif")

download_all_sprites_all_mons()
