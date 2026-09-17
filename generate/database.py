import sqlite3

from models import PokemonForm, SpeciesRow, SpeciesWithForms


def get_species_forms(conn: sqlite3.Connection, natdex: int):
    cursor = conn.cursor()
    cursor.execute(f"SELECT * FROM form WHERE national_dex = {natdex}")
    rows = cursor.fetchall()
    return [PokemonForm.model_validate(dict(row)) for row in rows]


def get_species(conn: sqlite3.Connection):
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM species order by national_dex")
    rows = cursor.fetchall()
    all_species: list[SpeciesWithForms] = []

    for row in rows:
        species = SpeciesRow.model_validate(dict(row))
        forms = get_species_forms(conn, species.national_dex)
        all_species.append(
            SpeciesWithForms(
                national_dex=species.national_dex, name=species.name, forms=forms
            )
        )

    return all_species

all_species: list[SpeciesWithForms] = []

def get_species_name(national_dex: int) -> str:
    global all_species
    
    if not len(all_species):
        with sqlite3.connect("pkm.db") as conn:
            all_species = get_species(conn)

    return all_species[national_dex - 1].name


if __name__ == "__main__":
    with sqlite3.connect("generate/pkm.db") as conn:
        conn.row_factory = sqlite3.Row
        all_species = get_species(conn)
