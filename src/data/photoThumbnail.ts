/** Commons serves only standard thumbnail widths; 330 px is the closest bucket for cards. */
const THUMBNAIL_WIDTH = 330
/** Standard Commons bucket for the zoomed photo; sharp on most screens without loading the original. */
const LARGE_WIDTH = 1920

const withWidth = (src: string, width: number) =>
  src.replace(/\/(\d+)px-([^/]+)$/, `/${width}px-$2`)

/** Smaller Commons thumbnail of a photo URL; originals without a thumb path stay as they are. */
export const toThumbnailUrl = (src: string) => withWidth(src, THUMBNAIL_WIDTH)

export const toLargeUrl = (src: string) => withWidth(src, LARGE_WIDTH)
