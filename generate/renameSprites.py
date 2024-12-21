import os
import re

def extract_suffix_from_filename(filename):
    match = re.search(r"gFrontSprite\d+(.*)\.png$", filename, re.IGNORECASE)
    return match.group(1) if match else None

def format_suffix(suffix):
    if not suffix:
        return suffix
    return suffix[0].upper() + suffix[1:].lower()

def rename_images(source_folder, destination_folder):
    if not os.path.exists(destination_folder):
        os.makedirs(destination_folder)

    for filename in os.listdir(source_folder):
        suffix = extract_suffix_from_filename(filename)
        if suffix:
            formatted_suffix = format_suffix(suffix)
            source_path = os.path.join(source_folder, filename)
            destination_path = os.path.join(destination_folder, f"{formatted_suffix}.png")
            os.rename(source_path, destination_path)
            print(f"Renamed: {source_path} -> {destination_path}")
        else:
            print(f"Skipped file (no suffix found): {filename}")

source_folder = "./generate/ubSprites"
destination_folder = "./public/sprites/unbound"

rename_images(source_folder, destination_folder)
