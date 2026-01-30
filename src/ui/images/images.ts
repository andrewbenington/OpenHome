export const getPublicImageURL = (path: string): string => {
  return `/${path}`
}

export const getTypeIconPath = (type: string): string => {
  return `types/${type.toLowerCase()}.png`
}
