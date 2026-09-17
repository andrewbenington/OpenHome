import logging
import os
import sqlite3
import subprocess
import threading
import urllib.request
from pathlib import Path

import database
from models import GENDER_DIFFERENCES, PokemonForm, SpeciesWithForms
from national_dex import NationalDex
from querier import SpriteSource

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


def download_png(url: str | None, directory, filename: str, overwrite=False):
    if url is None:
        return False, False

    if should_ignore_url(url):
        logger.info(f"ignoring previously failed url {url}")

    if not overwrite and (
        os.path.isfile(os.path.join(directory, filename))
        or os.path.isfile(os.path.join(directory, filename.replace("png", "webp")))
    ):
        print(f"{filename} already exists in {directory}")
        return False, False

    print(f"Downloading {filename} from {url}...")
    try:
        opener = urllib.request.build_opener()
        opener.addheaders = [("User-agent", "Mozilla/5.0")]
        urllib.request.install_opener(opener)
        png_path = os.path.join(directory, filename)
        urllib.request.urlretrieve(url, png_path)
        convert_to_webp(png_path)
        print(f"\tDownloaded {filename} to {directory}")
        return True, False
    except Exception as e:  # noqa: BLE001
        print(f"\tError downloading: {e}")
        ignore_url(url)

        return True, "404" not in str(e)


def convert_to_webp(input_path: str, output_path: str | None = None) -> str:
    input = Path(input_path)
    output = Path(output_path) if output_path else input.with_suffix(".webp")

    subprocess.run(
        [
            "magick",
            str(input),
            "-background",
            "none",
            "-resize",
            "384x384",
            "-gravity",
            "center",
            "-extent",
            "384x384",
            "-quality",
            "80",
            str(output),
        ],
        check=True,
    )

    if input.with_suffix(".png").exists():
        input.with_suffix(".png").unlink()

    return str(output)


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
        download_sprite_variants_bulbagarden(form, SpriteSource.HOME, "home")
    if form.has_champions_sprite():
        download_sprite_variants_bulbagarden(
            form, SpriteSource.CHAMPIONS, "box-champions"
        )
    # if dex_number <= 724 and not excludeFormLA(form: PokemonForm):
    #     download_sprite_variants_pokemon_db(
    #         dex_number, form.form_index, form_name, "legends-arceus", "gen8a")
    # if form.national_dex <= 1025 and form.has_scarlet_violet_sprite():
    #     download_sprite_variants_pokemon_db(form,  "scarlet-violet", "gen9")


def download_sprite_variants_pokemon_db(
    form: PokemonForm, source: SpriteSource, folder, includeFemale=True
):
    if "-totem" in form.name:
        return

    extension = ".gif" if "anim" in source else ".png"

    for sprite_name in [form.sprite_name]:
        download_png(
            form.pokemon_db_sprite_url(False, source, False),
            "../public/sprites/" + folder,
            sprite_name + extension,
        )

        if not source.has_shinies():
            continue

        download_png(
            form.pokemon_db_sprite_url(True, source, False),
            "../public/sprites/" + folder + "/shiny",
            sprite_name + extension,
        )
        if (
            includeFemale
            and form.national_dex in GENDER_DIFFERENCES
            and form.form_index == 0
            and form.national_dex != NationalDex.TORCHIC
            and form.national_dex != NationalDex.BUIZEL
        ):
            download_png(
                form.pokemon_db_sprite_url(False, source, is_female=True),
                "../public/sprites/" + folder,
                sprite_name + "-f" + extension,
            )
            download_png(
                form.pokemon_db_sprite_url(True, source, is_female=True),
                "../public/sprites/" + folder + "/shiny",
                sprite_name + "-f" + extension,
            )


OVERWRITE = False


def download_sprite_variants_bulbagarden(
    form: PokemonForm, source: SpriteSource, folder: str, includeFemale=True
):
    if "-totem" in form.name:
        return

    extension = ".gif" if "anim" in source else ".png"

    for sprite_name in [form.sprite_name]:
        filename = sprite_name + extension
        filename = filename.replace("png", "webp")

        if OVERWRITE or not os.path.isfile(
            os.path.join("../public/sprites/" + folder, filename)
        ):
            print(
                f"downloading to {os.path.join('../public/sprites/' + folder, filename)}"
            )
            download_png(
                form.bulbagarden_sprite_url(source.default_group()),
                "../public/sprites/" + folder,
                sprite_name + extension,
                overwrite=OVERWRITE,
            )

        if not source.has_shinies():
            continue

        if OVERWRITE or not os.path.isfile(
            os.path.join("../public/sprites/" + folder + "/shiny", filename)
        ):
            download_png(
                form.bulbagarden_sprite_url(source.default_group().shiny()),
                "../public/sprites/" + folder + "/shiny",
                sprite_name + extension,
                overwrite=OVERWRITE,
            )

        if (
            includeFemale
            and form.national_dex in GENDER_DIFFERENCES
            and form.form_index == 0
            and form.national_dex != NationalDex.TORCHIC
            and form.national_dex != NationalDex.BUIZEL
        ):
            filename = sprite_name + "-f" + extension
            filename = filename.replace("png", "webp")
            if OVERWRITE or not os.path.isfile(
                os.path.join("../public/sprites/" + folder, filename)
            ):
                download_png(
                    form.bulbagarden_sprite_url(source.default_group().female()),
                    "../public/sprites/" + folder,
                    sprite_name + "-f" + extension,
                    overwrite=OVERWRITE,
                )

            if OVERWRITE or not os.path.isfile(
                os.path.join("../public/sprites/" + folder + "/shiny", filename)
            ):
                download_png(
                    form.bulbagarden_sprite_url(
                        source.default_group().female().shiny()
                    ),
                    "../public/sprites/" + folder + "/shiny",
                    sprite_name + "-f" + extension,
                    overwrite=OVERWRITE,
                )


# def download_sprite_variants_pokencyclopedia_coloxd(form: PokemonForm):
#     download_png(form.colo_xd_sprite_url(False), "../public/sprites/gen3gc", form.name + ".gif")
#     download_png(form.colo_xd_sprite_url(True), "../public/sprites/gen3gc/shiny", form.name + ".gif")


if __name__ == "__main__":
    download_all_sprites_all_mons()

    with open("ignore_urls.txt", "+w") as f:
        f.write("\n".join(list(IGNORE_URLS)))
