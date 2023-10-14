import json
import os
import re
import threading
import time
import urllib.request

import requests
from bs4 import BeautifulSoup
from items import Items

os.makedirs("ribbons", exist_ok=True)


def split_camel_case_string(s):
    return re.findall(r'[A-Z](?:[a-z]+|[A-Z]*(?=[a-z]|$))', s)

def getPokeSpriteMap():
    response = requests.get("https://raw.githubusercontent.com/msikma/pokesprite/master/data/misc.json")

    if response.status_code == 200:
        # If the request was successful, parse the JSON data into a dictionary
        return json.loads(response.content)
    else:
        print("Error fetching item map. Status code:", response.status_code)
        exit
    # print(f"{filename} from {url}")
    # return False, False

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
        print(f"\tDownloaded to {directory}")
        return True, False
    except Exception as e:
        print(f"\tError downloading: {e}")
        return True, "404" not in str(e)
    # print(f"{filename} from {url}")
    # return False, False

def download_all_sprites():
    MiscDict = getPokeSpriteMap()
    for ribbon in MiscDict["ribbon"]:
        if "gen-8" in ribbon["files"]:
            path = ribbon["files"]["gen-8"]
        elif "gen-4" in ribbon["files"]:
            path = ribbon["files"]["gen-4"]
        elif "gen-3" in ribbon["files"]:
            path = ribbon["files"]["gen-3"]
        directory = "ribbons"
        filename = path.split("/")[-1]
        filename = filename.replace("-ribbon", "")
        url = f"https://raw.githubusercontent.com/msikma/pokesprite/master/misc/{path}"
        thread = threading.Thread(target=download_png, args=(url, directory, filename))
        thread.start()
    for mark in MiscDict["mark"]:
        path = mark["files"]["gen-8"]
        directory = "ribbons"
        filename = path.split("/")[-1]
        url = f"https://raw.githubusercontent.com/msikma/pokesprite/master/misc/{path}"
        thread = threading.Thread(target=download_png, args=(url, directory, filename))
        thread.start()
            



# scrape_bulbapedia_gen_9()
# scrape_bulbapedia_gen_8()
download_all_sprites()
# print(POKEMON_DATA["19"]["formes"][1])
# print(exclude_forme_gen8(19, POKEMON_DATA["19"]["formes"][1]))
