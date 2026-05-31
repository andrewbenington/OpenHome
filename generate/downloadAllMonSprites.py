import os
import sqlite3
import subprocess
import threading
import urllib.request
from pathlib import Path

import database
from models import PokemonForm, SpeciesWithForms

# if not os.path.isdir('public'):
#     print("current directory must be project source. exiting")
#     exit(1)

POKEMON_DATA: list[SpeciesWithForms] = []

threadEvent = threading.Event()

with sqlite3.connect("pkm.db") as conn:
    POKEMON_DATA = database.get_species(conn)

def download_all_sprites_all_mons():
    os.makedirs("../public/sprites/box/shiny", exist_ok=True)
    os.makedirs("../public/sprites/home/shiny", exist_ok=True)
    os.makedirs("../public/sprites/gen1", exist_ok=True)
    os.makedirs("../public/sprites/gen2/shiny", exist_ok=True)
    os.makedirs("../public/sprites/gen3/shiny", exist_ok=True)
    os.makedirs("../public/sprites/gen3gc/shiny", exist_ok=True)
    os.makedirs("../public/sprites/gen4/shiny", exist_ok=True)
    # os.makedirs("../public/sprites/gen5/shiny", exist_ok=True)
    # os.makedirs("../public/sprites/gen6/shiny", exist_ok=True)
    # os.makedirs("../public/sprites/gen7/shiny", exist_ok=True)
    # os.makedirs("../public/sprites/gen8/shiny", exist_ok=True)
    # os.makedirs("../public/sprites/gen8a/shiny", exist_ok=True)
    os.makedirs("../public/sprites/gen9/shiny", exist_ok=True)
    os.makedirs("../public/sprites/gen9za/shiny", exist_ok=True)
    for mon in POKEMON_DATA:
        for form in mon.forms:
            if mon.national_dex in IN_CHAMPIONS:
                print(form.name)
            if form.form_index >= len(mon.forms):
                print(f"{form.name} INVALID INDEX: {len(mon.forms)} ({len(mon.forms)} present)")
            thread_all_sprite_downloads(form)

def download_png(url: str | None, directory, filename: str):
    if url is None:
        return False, False

    if os.path.isfile(os.path.join(directory, filename)) or os.path.isfile(os.path.join(directory, filename.replace("png", "webp"))):
        print(f"{filename} already exists in {directory}")
        return False, False

    print(f"Downloading {filename} from {url}...")
    try:
        opener = urllib.request.build_opener()
        opener.addheaders = [('User-agent', 'Mozilla/5.0')]
        urllib.request.install_opener(opener)
        png_path = os.path.join(directory, filename)
        urllib.request.urlretrieve(url, png_path)
        convert_to_webp(png_path)
        print(f"\tDownloaded {filename} to {directory}")
        return True, False
    except Exception as e:
        print(f"\tError downloading: {e}")
        return True, "404" not in str(e)
    # print(f"{filename} from {url}")
    # return False, False
    
def convert_to_webp(input_path: str, output_path: str | None = None) -> str:
    input = Path(input_path)
    output = Path(output_path) if output_path else input.with_suffix('.webp')

    subprocess.run([
        'magick', str(input),
        '-background', 'none',
        '-resize', '384x384',
        '-gravity', 'center',
        '-extent', '384x384',
        '-quality', '80',
        str(output)
    ], check=True)

    if input.with_suffix('.png').exists():
        input.with_suffix('.png').unlink()

    return str(output)

gender_differences = [
    3, 12, 19, 20, 25, 26, 41, 42, 44, 45, 64, 65, 84, 85, 97, 111, 112, 118,
    119, 123, 129, 130, 133, 154, 165, 166, 178, 185, 186, 190, 194, 195, 198,
    202, 203, 207, 208, 212, 214, 215, 215, 217, 221, 224, 229, 232, 255, 256,
    257, 267, 269, 272, 274, 275, 307, 308, 315, 316, 317, 322, 323, 332, 350,
    369, 396, 397, 398, 399, 400, 401, 402, 403, 404, 405, 407, 415, 417, 418,
    419, 424, 443, 444, 445, 449, 450, 453, 454, 456, 457, 459, 460, 461, 464,
    465, 473, 521, 592, 593, 668, 902]


IN_CHAMPIONS = [
  3, 6, 9, 15, 18, 24, 25, 26, 36, 38, 59, 65, 68, 71, 80, 94, 115, 121, 127, 128, 130, 132, 134,
  135, 136, 142, 143, 149, 154, 157, 160, 168, 181, 184, 186, 196, 197, 199, 205, 208, 212, 214,
  227, 229, 248, 279, 282, 302, 306, 308, 310, 319, 323, 324, 334, 350, 351, 354, 358, 359, 362,
  389, 392, 395, 405, 407, 409, 411, 428, 442, 445, 448, 450, 454, 460, 461, 464, 470, 471, 472,
  473, 475, 478, 479, 497, 500, 503, 505, 510, 512, 514, 516, 530, 531, 534, 547, 553, 563, 569,
  571, 579, 584, 587, 609, 614, 618, 623, 635, 637, 652, 655, 658, 660, 663, 666, 670, 671, 675,
  676, 678, 681, 683, 685, 693, 695, 697, 699, 700, 701, 702, 706, 707, 709, 711, 713, 715, 724,
  727, 730, 733, 740, 745, 748, 750, 752, 758, 763, 765, 766, 778, 780, 784, 823, 841, 842, 844,
  855, 858, 866, 867, 869, 877, 887, 899, 900, 902, 903, 908, 911, 914, 925, 934, 936, 937, 939,
  952, 956, 959, 964, 968, 970, 981, 983, 1013, 1018, 1019,
]

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
    # if "Totem" in form.name:
    #     return
    # if form.national_dex <= 151 and form.form_index == 0:
    #     download_sprite_variants_pokemon_db(form, "red-blue", "gen1", False)
    # if form.national_dex <= 251 and form.form_index == 0 or form.national_dex == 201 and form.form_index <= 25:
    #     download_sprite_variants_pokemon_db(form, "crystal", "gen2", False)
    # if form.national_dex <= 386 and form.form_index == 0 or form.national_dex == 201 or form.national_dex == 386:
    #     download_sprite_variants_pokemon_db(form, "emerald", "gen3", False)
    #     # download_sprite_variants_pokencyclopedia_coloxd(form)
    # if form.national_dex <= 493 and form.has_gen4_sprite():
    #     download_sprite_variants_pokemon_db(form, "heartgold-soulsilver", "gen4", form.national_dex != 133 and form.national_dex != 419)
    # if form.national_dex <= 649 and not excludeFormGen5(form):
    #     download_sprite_variants_pokemon_db(form, "black-white/anim", "gen5", form.national_dex != 133)
    # if form.national_dex <= 721 and not excludeFormGen456(form: PokemonForm):
    #     download_sprite_variants_pokemon_db(form, "bank", "gen6", form.national_dex != 133)
    # if form.national_dex == 774:
    #     download_sprite_variants_pokemon_db(form, "sun-moon", "gen7")
    # elif form.national_dex <= 809 and not excludeFormGen7(form: PokemonForm):
    #     download_sprite_variants_pokemon_db(
    #         form.national_dex, form.form_index, form_name, "ultra-sun-ultra-moon", "gen7", form.national_dex != 133)
    # if form.national_dex <= 1025 and form.has_home_sprite():
    #     download_sprite_variants_bulbagarden(form, "home", "box")
    if form.has_home_sprite() and form.national_dex in IN_CHAMPIONS:
        download_sprite_variants_bulbagarden(form, "champions", "box")
    # if dex_number <= 724 and not excludeFormLA(form: PokemonForm):
    #     download_sprite_variants_pokemon_db(
    #         dex_number, form.form_index, form_name, "legends-arceus", "gen8a")
    # if form.national_dex <= 1025 and form.has_scarlet_violet_sprite():
    #     download_sprite_variants_pokemon_db(form,  "scarlet-violet", "gen9")

def download_sprite_variants_pokemon_db(form: PokemonForm, game, folder, includeFemale=True):
    if "-totem" in form.name:
        return
    
    extension = ".gif" if "anim" in game else ".png"

    for sprite_name in [form.sprite_name]:
        download_png(form.pokemon_db_sprite_url(False, game, False), "../public/sprites/" + folder, sprite_name + extension)
        
        if game == "red-blue" or game == 'scarlet-violet':
            continue

        download_png(form.pokemon_db_sprite_url(True, game, False), "../public/sprites/" + folder + "/shiny", sprite_name + extension)
        if includeFemale and form.national_dex in gender_differences and form.form_index == 0 and form.national_dex != 255 and form.national_dex != 418:
            download_png(form.pokemon_db_sprite_url(False, game, is_female=True), "../public/sprites/" + folder, sprite_name + "-f" + extension)
            download_png(form.pokemon_db_sprite_url(True, game, is_female=True), "../public/sprites/" + folder + "/shiny", sprite_name + "-f" + extension)

def download_sprite_variants_bulbagarden(form: PokemonForm, game, folder, includeFemale=True):
    if "-totem" in form.name:
        return
    
    extension = ".gif" if "anim" in game else ".png"

    for sprite_name in [form.sprite_name]:
        filename = sprite_name + extension
        filename = filename.replace("png", "webp")

        if not os.path.isfile(os.path.join("../public/sprites/" + folder, filename)):
            print(f"downloading {os.path.join("../public/sprites/" + folder, filename)}")
            download_png(form.bulbagarden_sprite_url(False, game, False), "../public/sprites/" + folder, sprite_name + extension)
        
        if game == "red-blue" or game == 'scarlet-violet':
            continue

        if not os.path.isfile(os.path.join("../public/sprites/" + folder + "/shiny", filename)):
            download_png(form.bulbagarden_sprite_url(True, game, False), "../public/sprites/" + folder + "/shiny", sprite_name + extension)
        else:
            return

        if includeFemale and form.national_dex in gender_differences and form.form_index == 0 and form.national_dex != 255 and form.national_dex != 418:
            filename = sprite_name + "-f" + extension
            filename = filename.replace("png", "webp")
            if not os.path.isfile(os.path.join("../public/sprites/" + folder, filename)):
                download_png(form.bulbagarden_sprite_url(False, game, is_female=True), "../public/sprites/" + folder, sprite_name + "-f" + extension)

            if not os.path.isfile(os.path.join("../public/sprites/" + folder + "/shiny", filename)):
                download_png(form.bulbagarden_sprite_url(True, game, is_female=True), "../public/sprites/" + folder + "/shiny", sprite_name + "-f" + extension)

# def download_sprite_variants_pokencyclopedia_coloxd(form: PokemonForm):
#     download_png(form.colo_xd_sprite_url(False), "../public/sprites/gen3gc", form.name + ".gif")
#     download_png(form.colo_xd_sprite_url(True), "../public/sprites/gen3gc/shiny", form.name + ".gif")


if __name__ == "__main__":
    download_all_sprites_all_mons()
