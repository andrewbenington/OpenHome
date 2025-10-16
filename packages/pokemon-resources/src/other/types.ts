export type Type =
    | 'Fire'
    | 'Grass'
    | 'Electric'
    | 'Ghost'
    | 'Fairy'
    | 'Water'
    | 'Ice'
    | 'Rock'
    | 'Ground'
    | 'Flying'
    | 'Fighting'
    | 'Psychic'
    | 'Dark'
    | 'Bug'
    | 'Steel'
    | 'Poison'
    | 'Dragon'
    | 'Normal'

export type TeraType = Type | 'Stellar'

export const Types: Type[] = [
    'Normal',
    'Fighting',
    'Flying',
    'Poison',
    'Ground',
    'Rock',
    'Bug',
    'Ghost',
    'Steel',
    'Fire',
    'Water',
    'Grass',
    'Electric',
    'Psychic',
    'Ice',
    'Dragon',
    'Dark',
    'Fairy',
]

export function teraTypeFromIndex(index: number) {
    return index === 99 ? 'Stellar' : Types[index]
}
