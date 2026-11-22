/** Commons serves only standard thumbnail widths; 330 px is the closest bucket for cards. */
const THUMBNAIL_WIDTH = 330

/** Smaller Commons thumbnail of a photo URL; originals without a thumb path stay as they are. */
export const toThumbnailUrl = (src: string) =>
  src.replace(/\/(\d+)px-([^/]+)$/, `/${THUMBNAIL_WIDTH}px-$2`)
