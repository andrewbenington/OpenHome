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
    cursor.execute("SELECT * FROM species")
    rows = cursor.fetchall()
    all_species: list[SpeciesWithForms] = []

    for row in rows:
        species = SpeciesRow.model_validate(dict(row))
        forms = get_species_forms(conn, species.national_dex)
        all_species.append(SpeciesWithForms(national_dex=species.national_dex, name=species.name, forms=forms))
    
    return all_species

if __name__ == "__main__":
    with sqlite3.connect("generate/pkm.db") as conn:
      conn.row_factory = sqlite3.Row
      all_species = get_species(conn)
      print(all_species[900])