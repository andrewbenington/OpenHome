import json
import os
import shutil

# Load the JSON file
with open('../../../consts/JSON/Pokemon.json') as f:
    pokemonList = json.load(f)

for _, mon in pokemonList.items():
    for forme in mon["formes"]:
        sprite = forme["sprite"]
        [x, y] = forme["spriteIndex"]
        if (os.path.exists("BoxIcons/index-" + str(y * 37 + x) + ".png")):
            os.rename("BoxIcons/index-" + str(y * 37 + x) + ".png", "BoxIcons/" + sprite + ".png")
        
