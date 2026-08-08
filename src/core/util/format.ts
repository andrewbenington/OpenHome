export function pluralize(count: number, unit: string): string {
  return count === 1 ? `1 ${unit}` : `${count} ${unit}s`
}
