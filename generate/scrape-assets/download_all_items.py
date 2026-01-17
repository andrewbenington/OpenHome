import json
import os
import re
import threading
import urllib.request

import requests
from bs4 import BeautifulSoup
from mega_stones import MEGA_STONES_ZA

# if not os.path.isdir('src/renderer/public'):
#     print("current directory must be project source. aborting")
#     exit(1)

ROOT_DIR = "out"

os.makedirs(f"{ROOT_DIR}/items/index", exist_ok=True)
os.makedirs(f"{ROOT_DIR}/items/tm", exist_ok=True)
os.makedirs(f"{ROOT_DIR}/items/tr", exist_ok=True)
os.makedirs(f"{ROOT_DIR}/items/shared", exist_ok=True)
os.makedirs(f"{ROOT_DIR}/items/gen3", exist_ok=True)


def split_camel_case_string(s):
    return re.findall(r"[A-Z](?:[a-z]+|[A-Z]*(?=[a-z]|$))", s)


def getPokeSpriteMap():
    response = requests.get(
        "https://raw.githubusercontent.com/msikma/pokesprite/master/data/item-map.json"
    )

    if response.status_code == 200:
        # If the request was successful, parse the JSON data into a dictionary
        return json.loads(response.content)
    else:
        print("Error fetching item map. Status code:", response.status_code)
        exit()


def scrape_bulbapedia_gen_9():
    # Set the URL of the Bulbapedia page
    url = "https://bulbapedia.bulbagarden.net/wiki/List_of_items_by_index_number_(Generation_IX)"

    # Send a GET request to the page and parse the HTML content using BeautifulSoup
    response = requests.get(url)
    soup = BeautifulSoup(response.content, "html.parser")

    # Find the table on the page
    table = soup.find("table", class_="sortable")

    if not table:
        print("Could not find the table. Exiting.")
        exit()

    # Loop through each row in the table
    for row in table.find_all("tr")[1:]:
        # Extract the columns for each row
        columns = row.find_all("td")
        if len(columns) > 0:
            # Extract the item index, name, and type
            filename = f"{int(columns[0].text.strip()):04}.png"
            sprite_src = "https:" + columns[2].find("img")["src"]
            name = columns[3].text.strip()
            directory = "src/renderer/public/items/index/"
            if name.startswith("TM") and "Bag_TM_" in sprite_src:
                directory = "src/renderer/public/items/tm/"
                filename = sprite_src.split("Bag_TM_")[1].split("_")[0].lower() + ".png"
            elif "TM_Material_Sprite" in sprite_src:
                directory = "src/renderer/public/items/shared"
                filename = "tm-material.png"
            elif "Picnic_Set" in sprite_src:
                directory = "src/renderer/public/items/shared"
                filename = "picnic-set.png"
            elif "Bag_None_Sprite" in sprite_src:
                continue

            thread = threading.Thread(
                target=download_png, args=(sprite_src, directory, filename)
            )
            thread.start()


def scrape_bulbapedia_gen_8():
    # Set the URL of the Bulbapedia page
    url = "https://bulbapedia.bulbagarden.net/wiki/List_of_items_by_index_number_(Generation_VIII)"

    # Send a GET request to the page and parse the HTML content using BeautifulSoup
    response = requests.get(url)
    soup = BeautifulSoup(response.content, "html.parser")

    # Find the table on the page
    table = soup.find("table", class_="sortable")

    # Loop through each row in the table
    for row in table.find_all("tr")[1:]:
        # Extract the columns for each row
        columns = row.find_all("td")
        if len(columns) > 0:
            try:
                # Extract the item index, name, and type
                filename = f"{int(columns[0].text.strip()):04}.png"
                sprite_src = "https:" + columns[2].find("img")["src"]
                name = columns[3].text.strip()
                if name in ["???", "[[]]"]:
                    continue
                directory = "src/renderer/public/items/index/"
                if name.startswith("TM") and "TMV" not in name:
                    directory = "src/renderer/public/items/tm/"
                    filename = (
                        sprite_src.split("Bag_TM_")[1].split("_")[0].lower() + ".png"
                    )
                elif name.startswith("TR"):
                    directory = "src/renderer/public/items/tr/"
                    filename = (
                        sprite_src.split("Bag_TR_")[1].split("_")[0].lower() + ".png"
                    )
                elif name.startswith("HM"):
                    continue
                elif "TM_Material_Sprite" in sprite_src:
                    directory = "src/renderer/public/items/shared"
                    filename = "tm-material.png"
                elif "Picnic_Set" in sprite_src:
                    directory = "src/renderer/public/items/shared"
                    filename = "picnic-set.png"
                elif name.startswith("Data Card"):
                    directory = "src/renderer/public/items/shared"
                    filename = "data-card.png"
                elif "Dynamax_Crystal" in sprite_src:
                    directory = "src/renderer/public/items/shared"
                    filename = "dynamax-crystal.png"
                elif name.startswith("Recipe:"):
                    directory = "src/renderer/public/items/shared"
                    filename = "recipe.png"
                elif name == "Lost Satchel":
                    directory = "src/renderer/public/items/shared"
                    filename = "lost-satchel.png"
                elif name.startswith("Old Verse"):
                    directory = "src/renderer/public/items/shared"
                    filename = "old-verse.png"
                thread = threading.Thread(
                    target=download_png, args=(sprite_src, directory, filename)
                )
                thread.start()
            except Exception as error:
                print(error)


def scrape_bulbapedia_gen_3():
    # Set the URL of the Bulbapedia page
    url = "https://bulbapedia.bulbagarden.net/wiki/List_of_items_by_index_number_(Generation_III)"

    # Send a GET request to the page and parse the HTML content using BeautifulSoup
    response = requests.get(url)
    soup = BeautifulSoup(response.content, "html.parser")

    # Find the table on the page
    table = soup.find("table", class_="sortable")

    # Loop through each row in the table
    for row in table.find_all("tr")[1:]:
        # Extract the columns for each row
        columns = row.find_all("td")
        if len(columns) > 0:
            # Extract the item index, name, and type
            sprite_src = "https:" + columns[2].find("img")["src"]
            name = columns[3].text.strip()
            if name[-1] == "*":
                name = name[:-1]
            if " " not in name and "-" not in name:
                name = " ".join(split_camel_case_string(name))
            if name == "unknown":
                continue
            if name in [
                "Parlyz Heal",
                "Bicycle",
                "VS Seeker",
                "Devon Goods",
                "Itemfinder",
                "Pokéblock Case",
                "Thunderstone",
                "Never Melt Ice",
                "Up-Grade",
                "Stick",
                "Oak's Parcel",
            ]:
                continue
            if name[:2] == "X ":
                continue
            # if name in Items or "Rm." in name:
            #     continue
            directory = "src/renderer/public/items/gen3/"
            filename = name.lower().replace(" ", "-") + ".png"
            thread = threading.Thread(
                target=download_png, args=(sprite_src, directory, filename)
            )
            thread.start()


def scrape_bulbapedia_mega_stones():
    prefix = "out/items"

    # Set the URL of the Bulbapedia page
    sprite_src = "https://bulbapedia.bulbagarden.net/wiki/Mega_Stone"

    # Send a GET request to the page and parse the HTML content using BeautifulSoup
    response = requests.get(sprite_src)
    soup = BeautifulSoup(response.content, "html.parser")

    # Find the table on the page
    table = soup.find("table", class_="sortable")

    if not table:
        print("Could not find the table. Exiting.")
        exit()

    # Loop through each row in the table
    for row in table.find_all("img", class_="mw-file-element"):
        sprite_src = row["src"]
        if not isinstance(sprite_src, str):
            continue

        (index, name) = next(
            (
                stone
                for stone in MEGA_STONES_ZA
                if stone[1].replace(" ", "_") + "_ZA" in sprite_src
            ),
            (None, None),
        )

        if not index or not name:
            continue

        # Extract the item index, name, and type
        filename = f"{index:04}.png"
        directory = "../../public/items/index/"

        thread = threading.Thread(
            target=download_png, args=(sprite_src, directory, filename, True)
        )
        thread.start()


def download_png(url, directory, filename, overwrite=False):
    # Check if the file already exists in the directory
    if not overwrite and os.path.isfile(os.path.join(directory, filename)):
        # print(f"{filename} already exists in {directory}")
        return False, False

    print(f"Downloading {filename} from {url}...")
    try:
        opener = urllib.request.build_opener()
        opener.addheaders = [("User-agent", "Mozilla/5.0")]
        urllib.request.install_opener(opener)
        urllib.request.urlretrieve(url, os.path.join(directory, filename))
        print(f"\tDownloaded {filename} to {directory}")
        return True, False
    except Exception as e:
        print(f"\tError downloading: {e}")
        return True, "404" not in str(e)
    # print(f"{filename} from {url}")
    # return False, False


# scrape_bulbapedia_gen_9()
# scrape_bulbapedia_gen_8()
# scrape_bulbapedia_gen_3()
scrape_bulbapedia_mega_stones()
# print(POKEMON_DATA["19"]["formes"][1])
# print(exclude_forme_gen8(19, POKEMON_DATA["19"]["formes"][1]))
