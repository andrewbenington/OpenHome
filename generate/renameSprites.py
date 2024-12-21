import os
import re
import json

def extract_suffix_from_filename(filename):
    match = re.search(r"gFrontSprite(\d+)(.*)\.png$", filename, re.IGNORECASE)
    if match:
        return match.group(1), match.group(2)  # Return the number and suffix
    return None, None

def format_suffix(suffix):
    if not suffix:
        return suffix
    return suffix[0].upper() + suffix[1:].lower()

def rename_images(source_folder, destination_folder, json_output_file):
    if not os.path.exists(destination_folder):
        os.makedirs(destination_folder)

    mappings = {}

    for filename in os.listdir(source_folder):
        number, suffix = extract_suffix_from_filename(filename)
        if number is not None and suffix is not None:
            formatted_suffix = format_suffix(suffix)
            source_path = os.path.join(source_folder, filename)
            new_file_name = f"{formatted_suffix}.png"
            destination_path = os.path.join(destination_folder, new_file_name)
            
            os.rename(source_path, destination_path)
            mappings[int(str(number))] = new_file_name
            print(f"Renamed: {source_path} -> {destination_path}")
        else:
            print(f"Skipped file (no valid pattern found): {filename}")

    with open(json_output_file, 'w') as json_file:
        json.dump(mappings, json_file, indent=4)
        print(f"Mapping saved to {json_output_file}")

source_folder = "./generate/ubSprites"
destination_folder = "./public/sprites/unbound"
json_output_file = "./generate/mappings.json"

rename_images(source_folder, destination_folder, json_output_file)
