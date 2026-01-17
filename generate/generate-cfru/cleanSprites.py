# type: ignore

"""
This file removes the background of sprites. Created for CFRU style hacks.
"""

import os
from PIL import Image

def remove_upper_left_color(image_path):
    try:
        with Image.open(image_path) as img:
            img = img.convert("RGBA")
            pixels = img.load()

            upper_left_color = pixels[0, 0]

            for y in range(img.height):
                for x in range(img.width):
                    if pixels[x, y][:3] == upper_left_color[:3]:
                        pixels[x, y] = (0, 0, 0, 0)

            img.save(image_path)
            print(f"Processed {image_path}: Removed color {upper_left_color}")
    except Exception as e:
        print(f"Error processing {image_path}: {e}")

def process_images_in_folder(folder_path):
    if not os.path.exists(folder_path):
        print(f"The folder {folder_path} does not exist.")
        return

    for root, dirs, files in os.walk(folder_path):
        for file in files:
            if file.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp', '.gif')):
                image_path = os.path.join(root, file)
                remove_upper_left_color(image_path)

def main():
    folder_b = r".\public\sprites\unbound"

    if os.path.exists(folder_b):
        process_images_in_folder(folder_b)
    else:
        print(f"The folder {folder_b} does not exist.")

if __name__ == "__main__":
    main()
