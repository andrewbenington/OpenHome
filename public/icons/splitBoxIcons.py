import json
import os

# Load the JSON file
with open('../../../consts/JSON/Pokemon.json') as f:
    pokemonList = json.load(f)

for _, mon in pokemonList.items():
    for form in mon["forms"]:
        sprite = form["sprite"]
        [x, y] = form["spriteIndex"]
        if (os.path.exists("BoxIcons/index-" + str(y * 37 + x) + ".png")):
            os.rename("BoxIcons/index-" + str(y * 37 + x) + ".png", "BoxIcons/" + sprite + ".png")
        
