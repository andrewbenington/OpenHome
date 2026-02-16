import os
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
    for mon in POKEMON_DATA:
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
        # download_sprite_variants_pokencyclopedia_coloxd(form)
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

    for sprite_name in [form.sprite_name]:
        download_png(form.pokemon_db_sprite_url(False, game, False), "public/sprites/" + folder, sprite_name + extension)
        
        if game == "red-blue" or game == 'scarlet-violet':
            continue

        download_png(form.pokemon_db_sprite_url(True, game, False), "public/sprites/" + folder + "/shiny", sprite_name + extension)
        if includeFemale and form.national_dex in gender_differences and form.form_index == 0 and form.national_dex != 255 and form.national_dex != 418:
            download_png(form.pokemon_db_sprite_url(False, game, is_female=True), "public/sprites/" + folder, sprite_name + "-f" + extension)
            download_png(form.pokemon_db_sprite_url(True, game, is_female=True), "public/sprites/" + folder + "/shiny", sprite_name + "-f" + extension)

# def download_sprite_variants_pokencyclopedia_coloxd(form: PokemonForm):
#     download_png(form.colo_xd_sprite_url(False), "public/sprites/gen3gc", form.name + ".gif")
#     download_png(form.colo_xd_sprite_url(True), "public/sprites/gen3gc/shiny", form.name + ".gif")

download_all_sprites_all_mons()
