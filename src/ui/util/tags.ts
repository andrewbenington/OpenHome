/**
 * Utilities for encoding/decoding custom tags in the OHPKM notes field.
 *
 * Tags are stored as a hidden prefix in the notes string:
 *   <!--tag:Label:#hexcolor-->\n<user notes>
 *
 * This allows tags to persist through WASM serialization without
 * requiring new fields on the Rust struct.
 */

const TAG_PREFIX_RE = /^<!--tag:(.+?):(.+?)-->\n?/

export interface MonTag {
  label: string
  color: string
}

/** Parse a tag from the raw notes string. Returns undefined if no tag is present. */
export function parseTag(notes: string | undefined): MonTag | undefined {
  if (!notes) return undefined
  const match = notes.match(TAG_PREFIX_RE)
  if (!match) return undefined
  return { label: match[1], color: match[2] }
}

/** Strip the tag prefix from notes, returning only the user-visible text. */
export function stripTagFromNotes(notes: string | undefined): string {
  if (!notes) return ''
  return notes.replace(TAG_PREFIX_RE, '')
}

/** Prepend a tag prefix to user notes. If tag is undefined, returns notes unchanged. */
export function encodeTagInNotes(
  tag: MonTag | undefined,
  userNotes: string | undefined
): string | undefined {
  const text = userNotes ?? ''
  if (!tag) return text || undefined
  return `<!--tag:${tag.label}:${tag.color}-->\n${text}`
}
