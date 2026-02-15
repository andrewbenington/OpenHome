CREATE TABLE species(
    national_dex integer PRIMARY KEY,
    name text NOT NULL,
    level_up_type text NOT NULL CHECK (level_up_type IN ('Fast', 'Medium Fast', 'Medium Slow', 'Slow', 'Erratic', 'Fluctuating'))
);
CREATE TABLE form(
    national_dex integer NOT NULL REFERENCES species(national_dex),
    form_index integer NOT NULL,
    name text NOT NULL,
    display_name text NOT NULL,
    type1 text NOT NULL CHECK (type1 IN ('Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy')),
    type2 text CHECK (type2 IN ('Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy')),
    base_hp integer NOT NULL,
    base_attack integer NOT NULL,
    base_defense integer NOT NULL,
    base_special_attack integer NOT NULL,
    base_special_defense integer NOT NULL,
    base_speed integer NOT NULL,
    ability1 integer NOT NULL REFERENCES ability(id),
    ability2 integer REFERENCES ability(id),
    ability_hidden integer REFERENCES ability(id),
    egg_group1 text NOT NULL CHECK (egg_group1 IN ('Monster', 'Water 1', 'Bug', 'Flying', 'Field', 'Fairy', 'Grass', 'Human-Like', 'Water 3', 'Mineral', 'Amorphous', 'Water 2', 'Ditto', 'Dragon', 'Undiscovered')),
    egg_group2 text CHECK (egg_group2 IN ('Monster', 'Water 1', 'Bug', 'Flying', 'Field', 'Fairy', 'Grass', 'Human-Like', 'Water 3', 'Mineral', 'Amorphous', 'Water 2', 'Ditto', 'Dragon', 'Undiscovered')),
    gender_ratio text CHECK (gender_ratio IN ('Genderless', 'AllMale', 'AllFemale', 'Equal', 'M1ToF7', 'M1ToF3', 'M7ToF1', 'M3ToF1')),
    height_decimeters integer NOT NULL,
    weight_hectograms integer NOT NULL,
    is_base_form boolean NOT NULL,
    is_mega boolean NOT NULL,
    is_gmax boolean NOT NULL,
    is_battle_only boolean NOT NULL,
    is_sublegendary boolean NOT NULL,
    is_restricted_legendary boolean NOT NULL,
    is_ultra_beast boolean NOT NULL,
    is_paradox boolean NOT NULL,
    is_mythical boolean NOT NULL,
    regional text CHECK (regional IN ('Alola', 'Galar', 'Hisui', 'Paldea')),
    introduced_gen integer NOT NULL CHECK (introduced_gen BETWEEN 1 AND 9),
    sprite_name text NOT NULL,
    sprite_row integer NOT NULL,
    sprite_col integer NOT NULL,
    PRIMARY KEY (national_dex, form_index)
);
CREATE TABLE evolution(
    evo_national_dex integer NOT NULL,
    evo_form_index integer NOT NULL,
    prevo_national_dex integer NOT NULL,
    prevo_form_index integer NOT NULL,
    FOREIGN KEY (evo_national_dex, evo_form_index)
        REFERENCES form (national_dex, form_index),
    FOREIGN KEY (prevo_national_dex, prevo_form_index)
        REFERENCES form (national_dex, form_index)
);
CREATE TABLE move (
    id integer PRIMARY KEY,
    name text NOT NULL,
    accuracy integer,
    move_class text NOT NULL CHECK (move_class IN ('Physical', 'Special', 'Status')),
    generation text NOT NULL,
    power integer,
    base_pp integer NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy'))
);
CREATE TABLE ability (
    id integer PRIMARY KEY,
    name text NOT NULL,
    alias text NOT NULL
);
CREATE TABLE item(
    id integer PRIMARY KEY,
    name text NOT NULL
);
CREATE TABLE item_gen1(
    id integer PRIMARY KEY,
    modern_id integer REFERENCES item(id),
    name text NOT NULL
);
CREATE TABLE item_gen2(
    id integer PRIMARY KEY,
    modern_id integer REFERENCES item(id),
    name text NOT NULL
);
CREATE TABLE item_gen3(
    id integer PRIMARY KEY,
    modern_id integer REFERENCES item(id),
    name text NOT NULL
);
CREATE TABLE item_colosseum(
    id integer PRIMARY KEY,
    modern_id integer REFERENCES item(id),
    name text NOT NULL
);
CREATE TABLE item_xd(
    id integer PRIMARY KEY,
    modern_id integer REFERENCES item(id),
    name text NOT NULL
);
CREATE TABLE mega_evolution(
    national_dex integer NOT NULL,
    form_index integer NOT NULL,
    base_form_index integer NOT NULL,
    mega_stone_id integer REFERENCES item(id),
    PRIMARY KEY (national_dex, form_index),
    FOREIGN KEY (national_dex, form_index) REFERENCES form(national_dex, form_index)
);
CREATE TABLE item_radical_red(
    id integer PRIMARY KEY,
    modern_id integer REFERENCES item(id),
    name text NOT NULL
);
CREATE TABLE item_unbound(
    id integer PRIMARY KEY,
    modern_id integer REFERENCES item(id),
    name text NOT NULL
);
