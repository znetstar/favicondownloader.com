
export enum ImageFormat {
  png  = 'png',
  jpeg = 'jpeg',
  /* Needs custom libvips */
  gif = 'gif',
  webp = 'webp',
  /* Needs custom libvips */
  tiff  = 'tiff',
  /* Needs custom libvips */
  heic = 'heic',
  avif = 'avif'
}
export const ImageFormatMimeTypes = new Map<ImageFormat, string>(
  [
    [ ImageFormat.png, 'image/png' ],
    [ ImageFormat.jpeg, 'image/jpeg' ],
    [ ImageFormat.gif, 'image/gif' ],
    [ ImageFormat.webp, 'image/webp' ],
    [ ImageFormat.tiff, 'image/tiff' ],
    [ ImageFormat.heic, 'image/heic'  ],
    [ ImageFormat.avif, 'image/avif' ]
  ]
)
export const MimeTypesImageFormat = new Map<string, ImageFormat>(
  Array.from(ImageFormatMimeTypes.entries()).map(([a,b]) => [b,a])
);
