import Database from 'better-sqlite3'

export const abilityGetAllQuery = `-- name: AbilityGetAll :many
SELECT
  id, name, alias
FROM
  ability`

export interface AbilityGetAllRow {
  id: number
  name: any
  alias: any
}

export function abilityGetAll(): AbilityGetAllRow[] {
  const stmt = openDatabase().prepare(abilityGetAllQuery)
  const result = stmt.all()
  return result as AbilityGetAllRow[]
}

export function openDatabase() {
  return new Database('generate/pkm.db')
}
