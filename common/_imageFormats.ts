
export enum ImageFormat {
  png  = 'png',
  jpeg = 'jpeg',
  gif = 'gif',
  webp = 'webp',
  tiff  = 'tiff',
  avif = 'avif'
}
export const ImageFormatMimeTypes = new Map<ImageFormat, string>(
  [
    [ ImageFormat.png, 'image/png' ],
    [ ImageFormat.jpeg, 'image/jpeg' ],
    [ ImageFormat.gif, 'image/gif' ],
    [ ImageFormat.webp, 'image/webp' ],
    [ ImageFormat.tiff, 'image/tiff' ],
    [ ImageFormat.avif, 'image/avif' ]
  ]
)
export const MimeTypesImageFormat = new Map<string, ImageFormat>(
  Array.from(ImageFormatMimeTypes.entries()).map(([a,b]) => [b,a])
);
