import logging
import subprocess
import urllib.request
from enum import Enum, StrEnum
from pathlib import Path
from typing import Literal, Self

import requests
from bs4 import BeautifulSoup
from pydantic import BaseModel

from models import GENDER_DIFFERENCES, PokemonForm
from national_dex import NationalDex

logger = logging.getLogger(__name__)


class PokemonSpriteGroup(BaseModel):
    sprite_source: SpriteSource
    is_shiny: bool = False
    is_female: bool = False

    @staticmethod
    def source(s: SpriteSource) -> PokemonSpriteGroup:
        return PokemonSpriteGroup(sprite_source=s)

    def shiny(self) -> Self:
        self.is_shiny = True
        return self

    def female(self) -> Self:
        self.is_female = True
        return self

    def subdirectory(self, directory: str) -> Path:
        if self.is_shiny:
            return Path(directory + "/shiny")
        else:
            return Path(directory)

    def file_exists_png_or_webp(self, directory: str, form: PokemonForm) -> bool:
        gender = "-f" if self.is_female else ""
        subdirectory = self.subdirectory(directory)

        return (
            (subdirectory / self.filename(form)).exists()
            or (subdirectory / f"{form.sprite_name}{gender}.webp").exists()
        )

    def filename(self, form: PokemonForm) -> str:
        gender = "-f" if self.is_female else ""
        return f"{form.sprite_name}{gender}{self.sprite_source.file_extension()}"

    def is_applicable(self, form: PokemonForm, include_female: bool) -> bool:
        if self.is_female:
            return (
                include_female
                and self.sprite_source.has_female()
                and form.form_index == 0
                and not form.name.endswith("-f")
                and form.national_dex in GENDER_DIFFERENCES
                and form.national_dex != NationalDex.TORCHIC
                and form.national_dex != NationalDex.BUIZEL
            )

        return self.sprite_source.has_shinies() or not self.is_shiny

    def build_pokemon_db_url(self, form: PokemonForm) -> str:
        source = self.sprite_source

        form_name: str = form.pokemon_db_format()
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
            form.national_dex == NationalDex.OGERPON
            and source == SpriteSource.SCARLET_VIOLET
        ):
            form_name = form_name.removesuffix("-mask")
        if form_name.endswith("-four") and source == SpriteSource.SCARLET_VIOLET:
            form_name = form_name.replace("-four", "-family4")
        if "-core-" in form_name and source == SpriteSource.SCARLET_VIOLET:
            form_name = form_name.replace("core-", "") + "-core"
        shininess = (
            "normal" if not self.is_shiny or not source.has_shinies() else "shiny"
        )
        female_tag = (
            "-female"
            if self.is_female and form_name in female_stats
            else ("-f" if self.is_female else "")
        )
        return f"https://img.pokemondb.net/sprites/{source.pokemondb_dir()}/{shininess}/{form_name}{female_tag}{source.file_extension()}"

    def bulbagarden_sprite_url(self, form: PokemonForm) -> str | None:
        # if self.introduced_gen != 9 or not self.is_mega:
        #     return None
        segments = form.name.split("-")
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
        elif "Pikachu-" in form.name:
            forme_name = forme_name[1:2]
        elif forme_name == "-La Reine":
            forme_name = "-La_Reine"
        elif (
            "_Cream" in forme_name
            or "Caramel_Swirl" in forme_name
            or "Rainbow_Swirl" in forme_name
        ) and self.sprite_source != SpriteSource.CHAMPIONS:
            forme_name = forme_name[:-6]
        elif form.name == "Tauros-Paldea":
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
        elif self.is_female:
            forme_name = "_f"

        if self.sprite_source == SpriteSource.CHAMPIONS:
            if forme_name == "-Super":
                forme_name = "-Jumbo"
            elif forme_name == "-Masterpiece" or "-Busted" in forme_name:
                forme_name = ""

        shiny_suffix = "_s" if self.is_shiny else ""

        if self.sprite_source == SpriteSource.HOME and "Vivillon" in form.name:
            forme_name = forme_name[1:4]
            shiny_suffix = "_s" if self.is_shiny else ""

        form_suffix = (
            ""
            if form.form_index == 0
            and not (
                form.national_dex == 666 or form.national_dex == 671 or self.is_female
            )
            else forme_name
        )

        bulbaFilePage = f"https://archives.bulbagarden.net/wiki/File:{self.sprite_source.prefix()}{str(form.national_dex).zfill(4)}{form_suffix}{shiny_suffix}.png"

        return bulbagarden_image_url_from_page(bulbaFilePage)


class SpriteSource(StrEnum):
    BANK = "bank"
    HOME = "home"
    CHAMPIONS = "champions"

    RED_BLUE = "red-blue"
    BLACK_WHITE = "black-white"
    BLACK_WHITE_2 = "black-white-2"
    SCARLET_VIOLET = "scarlet-violet"

    def prefix(self) -> str | None:
        match self:
            case SpriteSource.CHAMPIONS:
                return "Menu_CP_"
            case SpriteSource.HOME:
                return "HOME"

    def default_group(self) -> PokemonSpriteGroup:
        return PokemonSpriteGroup.source(self)

    def all_groups(
        self,
    ) -> tuple[
        PokemonSpriteGroup, PokemonSpriteGroup, PokemonSpriteGroup, PokemonSpriteGroup
    ]:
        return (
            self.default_group(),
            self.default_group().shiny(),
            self.default_group().female(),
            self.default_group().shiny().female(),
        )

    def applicable_groups(
        self, form: PokemonForm, include_female: bool
    ) -> list[PokemonSpriteGroup]:
        return [g for g in self.all_groups() if g.is_applicable(form, include_female)]

    def find_missing_groups_in(
        self, directory: str, form: PokemonForm, overwrite=False
    ) -> list[PokemonSpriteGroup]:
        groups = []

        for group in self.applicable_groups(form, True):
            if overwrite or not group.file_exists_png_or_webp(directory, form):
                groups.append(group)

        return groups

    def pokemondb_dir(self) -> str:
        match self:
            case SpriteSource.BANK:
                return "bank"
            case SpriteSource.CHAMPIONS:
                return "champions"
            case SpriteSource.RED_BLUE:
                return "red-blue"
            case SpriteSource.BLACK_WHITE:
                return "black-white/anim"
            case SpriteSource.BLACK_WHITE_2:
                return "black-white-2/anim"
            case SpriteSource.SCARLET_VIOLET:
                return "scarlet-violet"
            case SpriteSource.HOME:
                return "home"

    def file_extension(self) -> str:
        match self:
            case SpriteSource.BLACK_WHITE | SpriteSource.BLACK_WHITE_2:
                return ".gif"
            case _:
                return ".png"

    def has_shinies(self) -> bool:
        return self != SpriteSource.RED_BLUE and self != SpriteSource.SCARLET_VIOLET
    
    def has_female(self) -> bool:
        return self != SpriteSource.RED_BLUE and self != SpriteSource.CHAMPIONS


class SpriteArchive(StrEnum):
    BULBAGARDEN = "bulbagarden"
    POKEMON_DB = "pokemon_db"

    def search_for_image_url(
        self, form: PokemonForm, group: PokemonSpriteGroup
    ) -> str | None:
        match self:
            case SpriteArchive.BULBAGARDEN:
                return group.bulbagarden_sprite_url(form)
            case SpriteArchive.POKEMON_DB:
                return group.build_pokemon_db_url(form)

    def download_png_convert_webp(
        self,
        form: PokemonForm,
        group: PokemonSpriteGroup,
        directory: str,
        overwrite=False,
    ) -> DownloadResult:
        subdirectory = group.subdirectory(directory)
        filename = group.filename(form)

        if not overwrite and group.file_exists_png_or_webp(directory, form):
            logger.warning(
                f"{filename.replace("png", "webp")} already exists in {directory}"
            )
            return DownloadResult.SKIPPED

        url = self.search_for_image_url(form, group)
        if not url:
            return DownloadResult.FAILED

        logger.info(f"Downloading {filename} from {url}...")
        try:
            opener = urllib.request.build_opener()
            opener.addheaders = [("User-agent", "Mozilla/5.0")]
            urllib.request.install_opener(opener)
            png_path = subdirectory / filename
            urllib.request.urlretrieve(url, png_path)
            convert_to_webp(png_path)
            logger.info(f"\tDownloaded {filename} to {directory}")
            return DownloadResult.DOWNLOADED
        except Exception as e:  # noqa: BLE001
            logger.error(f"\tError downloading: {e}")

            return DownloadResult.FAILED


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


type Failed = Literal[False]
type Downloaded = Literal[True]


class DownloadResult(Enum):
    SKIPPED = 0
    DOWNLOADED = 1
    FAILED = 2


def convert_to_webp(input_path: Path, output_path: str | None = None) -> str:
    output = Path(output_path) if output_path else input_path.with_suffix(".webp")

    subprocess.run(
        [
            "magick",
            str(input_path),
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

    if input_path.with_suffix(".png").exists():
        input_path.with_suffix(".png").unlink()

    return str(output)
