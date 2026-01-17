#!/usr/bin/env python3
"""
Fetches Radical Red move data from the source repository
and creates a moves-data.json file with correct IDs
"""

import json
import re
import urllib.request

MOVES_H_URL = 'https://raw.githubusercontent.com/Klendy/radical_red/master/include/constants/moves.h'

def fetch_file(url):
    """Fetch file content from URL"""
    with urllib.request.urlopen(url) as response:
        return response.read().decode('utf-8')

def parse_moves_h(content):
    """Parse moves.h file to extract move IDs and names"""
    moves = {}
    lines = content.split('\n')

    for line in lines:
        # Match lines like: #define MOVE_POUND 0x1
        match = re.match(r'^#define\s+MOVE_(\w+)\s+(0x[0-9A-Fa-f]+|\d+)', line)
        if match:
            name = match.group(1)
            id_str = match.group(2)

            # Convert to integer
            move_id = int(id_str, 16) if id_str.startswith('0x') else int(id_str)

            # Skip calculated values and special constants
            if 'MOVES_COUNT' in name or '_MAX_' in name or '_GMAX_' in name or name == 'NONE':
                continue

            # Convert MOVE_NAME to proper case
            # Handle special cases first
            if name.endswith('_P'):
                proper_name = format_move_name(name[:-2]) + ' (Physical)'
            elif name.endswith('_S'):
                proper_name = format_move_name(name[:-2]) + ' (Special)'
            else:
                proper_name = format_move_name(name)

            moves[str(move_id)] = {
                'id': move_id,
                'name': proper_name,
                'type': 'normal',  # Default values
                'power': 0,
                'accuracy': 0,
                'pp': 0,
                'class': 'status'
            }

    return moves

def format_move_name(name):
    """Format move name from constant to proper case"""
    # Handle special cases
    special_cases = {
        'VISE': 'Vise',
        'VICEGRIP': 'Vise Grip',
        'HIDDENPOWER': 'Hidden Power',
        'SOLARBEAM': 'Solar Beam',
        'DOUBLEEDGE': 'Double-Edge',
        'SOFTBOILED': 'Soft-Boiled',
        'SELFDESTRUCT': 'Self-Destruct',
        'SMELLINGSALT': 'Smelling Salts',
        'FEINTATTACK': 'Feint Attack',
        'ANCIENTPOWER': 'Ancient Power',
        'EXTREMESPEED': 'Extreme Speed',
        'SHADOWBALL': 'Shadow Ball',
        'FUTURESIGHT': 'Future Sight',
        'ROCKSMASH': 'Rock Smash',
        'FAKEOUT': 'Fake Out',
        'BLAZEKICK': 'Blaze Kick',
        'MUDSPORT': 'Mud Sport',
        'WATERSPORT': 'Water Sport',
        'GRASSWHISTLE': 'Grass Whistle',
        'POISONFANG': 'Poison Fang',
        'MUDSHOT': 'Mud Shot',
        'ROCKBLAST': 'Rock Blast',
        'SHOCKWAVE': 'Shock Wave',
        'MAGICCOAT': 'Magic Coat',
        'ASTONISH': 'Astonish',
        'WEATHERBALL': 'Weather Ball',
        'GRASSYTERRAIN': 'Grassy Terrain',
        'MISTYTERRAIN': 'Misty Terrain',
        'ELECTRICTERRAIN': 'Electric Terrain',
        'PSYCHICTERRAIN': 'Psychic Terrain',
        'HYPERSPACEHOLE': 'Hyperspace Hole',
        'SPACIALREND': 'Spacial Rend',
        'BLACKHOLEECLIPSE': 'Black Hole Eclipse',
        'CIRCLETHROW': 'Circle Throw',
        'REFLECTTYPE': 'Reflect Type',
    }

    if name in special_cases:
        return special_cases[name]

    # Simple approach: capitalize and replace underscores with spaces
    return name.replace('_', ' ').title()

def main():
    try:
        print('Fetching Radical Red move constants...')
        moves_h = fetch_file(MOVES_H_URL)

        print('Parsing move IDs and names...')
        moves = parse_moves_h(moves_h)

        print(f'Found {len(moves)} moves')

        # Write to file
        output_path = './src/lib/moves-data.json'
        with open(output_path, 'w') as f:
            json.dump(moves, f, indent=2)

        print(f'\n✓ Successfully created {output_path}')
        print(f'✓ Total moves: {len(moves)}')

        # Verify the problematic moves
        print('\nVerifying key moves:')
        test_moves = {
            'Black Hole Eclipse (P)': 0x304,
            'Circle Throw': 0x1BD,
            'Reflect Type': 0x28E,
            'Spacial Rend': 0x1ED,
            'Hyperspace Hole': 0x1FD
        }

        for name, move_id in test_moves.items():
            move = moves.get(str(move_id))
            if move:
                print(f'  {name} (ID {move_id}): {move["name"]}')
            else:
                print(f'  {name} (ID {move_id}): NOT FOUND')

    except Exception as e:
        print(f'Error: {e}')
        import traceback
        traceback.print_exc()
        exit(1)

if __name__ == '__main__':
    main()
