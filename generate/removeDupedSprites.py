import os
import hashlib

def calculate_file_hash(file_path):
    hash_func = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_func.update(chunk)
    return hash_func.hexdigest()

def build_file_hash_map(folder):
    file_hash_map = {}
    for root, _, files in os.walk(folder):
        for file in files:
            file_path = os.path.join(root, file)
            file_hash = calculate_file_hash(file_path)
            file_hash_map[file_hash] = file_path
    return file_hash_map

def remove_matching_files(folder_a, folder_b):
    folder_a_hash_map = build_file_hash_map(folder_a)
    folder_b_hash_map = build_file_hash_map(folder_b)

    for hash_a, path_a in folder_a_hash_map.items():
        if hash_a in folder_b_hash_map:
            path_b = folder_b_hash_map[hash_a]
            print(f"Removing {path_b} as it is identical to {path_a}.")
            try:
                os.remove(path_b)
            except Exception as e:
                print(f"Error removing {path_b}: {e}")

def main():
    folder_a = r".\public\sprites\rr"
    folder_b_destination = r".\generate\ubSprites"
    
    if not os.path.exists(folder_a):
        print(f"{folder_a} doesn't exist.")
    if not os.path.exists(folder_b_destination):
        print(f"{folder_b_destination} doesn't exist.")
    if os.path.exists(folder_a) and os.path.exists(folder_b_destination):
        remove_matching_files(folder_a, folder_b_destination)
    else:
        print(f"Either {folder_a} or {folder_b_destination} does not exist.")

if __name__ == "__main__":
    main()
