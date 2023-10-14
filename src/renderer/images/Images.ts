export const getPublicImageURL = (path: string): string => {
  const urlPath = `../${path}`
  return new URL(urlPath, import.meta.url).href
}
