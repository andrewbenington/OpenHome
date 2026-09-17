import logging
import os
import sqlite3
import threading

import database
from models import PokemonForm, SpeciesWithForms
from querier import SpriteArchive, SpriteSource

POKEMON_DATA: list[SpeciesWithForms] = []
IGNORE_URLS: set[str]

with open("ignore_urls.txt", "+w") as f:
    IGNORE_URLS = set(f.readlines())


def should_ignore_url(url: str) -> bool:
    return url in IGNORE_URLS


def ignore_url(url: str):
    IGNORE_URLS.add(url)


threadEvent = threading.Event()

logger = logging.getLogger(__name__)

with sqlite3.connect("pkm.db") as conn:
    POKEMON_DATA = database.get_species(conn)


def download_all_sprites_all_mons():
    os.makedirs("../public/sprites/box-champions/shiny", exist_ok=True)
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
            if form.form_index >= len(mon.forms):
                print(
                    f"{form.name} INVALID INDEX: {len(mon.forms)} ({len(mon.forms)} present)"
                )
            thread_all_sprite_downloads(form)



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
    if form.national_dex <= 1025 and form.has_home_sprite():
        download_sprite_variants_bulbagarden(
            form, SpriteSource.HOME, "../public/sprites/home"
        )
    if form.has_champions_sprite():
        download_sprite_variants_bulbagarden(
            form, SpriteSource.CHAMPIONS, "../public/sprites/box-champions"
        )
    # if dex_number <= 724 and not excludeFormLA(form: PokemonForm):
    #     download_sprite_variants_pokemon_db(
    #         dex_number, form.form_index, form_name, "legends-arceus", "gen8a")
    # if form.national_dex <= 1025 and form.has_scarlet_violet_sprite():
    #     download_sprite_variants_pokemon_db(form,  "scarlet-violet", "gen9")


def download_sprite_variants_pokemon_db(
    form: PokemonForm, source: SpriteSource, directory: str, includeFemale=True
):
    if "-totem" in form.name:
        return

    
    for group in source.find_missing_groups_in(directory, form, OVERWRITE):
        SpriteArchive.POKEMON_DB.download_png_convert_webp(
            form, group, directory, OVERWRITE
        )



OVERWRITE = False


def download_sprite_variants_bulbagarden(
    form: PokemonForm, source: SpriteSource, directory: str, includeFemale=True
):
    if "-totem" in form.name:
        return

    for group in source.find_missing_groups_in(directory, form, OVERWRITE):
        logger.error(f"GROUP MISSING: {directory}/{group.filename(form)}")
        SpriteArchive.BULBAGARDEN.download_png_convert_webp(
            form, group, directory, OVERWRITE
        )


# def download_sprite_variants_pokencyclopedia_coloxd(form: PokemonForm):
#     download_png(form.colo_xd_sprite_url(False), "../public/sprites/gen3gc", form.name + ".gif")
#     download_png(form.colo_xd_sprite_url(True), "../public/sprites/gen3gc/shiny", form.name + ".gif")


if __name__ == "__main__":
    download_all_sprites_all_mons()

    with open("ignore_urls.txt", "+w") as f:
        f.write("\n".join(list(IGNORE_URLS)))
