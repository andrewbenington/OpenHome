from enum import StrEnum
from typing import Self

from pydantic import BaseModel


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

    def all_groups(self) -> list[PokemonSpriteGroup]:
        return [
            self.default_group(),
            self.default_group().shiny(),
            self.default_group().female(),
            self.default_group().shiny().female(),
        ]

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
