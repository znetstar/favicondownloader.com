export type ImageFormatMimeType = 'image/png'|'image/x-icon'|'image/jpeg'|'image/webp'|'image/gif'|'image/tiff'|'image/heic'|'image/avif'|'image/vnd.microsoft.icon';
export enum ImageFormat {
  ico = 'ico',
  png  = 'png',
  jpeg = 'jpeg',
  gif = 'gif',
  webp = 'webp',
  avif = 'avif'
}
export const ImageFormatMimeTypes = new Map<ImageFormat, ImageFormatMimeType>(
  [
    [ ImageFormat.ico, 'image/x-icon' ],
    [ ImageFormat.png, 'image/png' ],
    [ ImageFormat.jpeg, 'image/jpeg' ],
    [ ImageFormat.gif, 'image/gif' ],
    [ ImageFormat.webp, 'image/webp' ],
    [ ImageFormat.avif, 'image/avif' ]
  ]
)
export const MimeTypesImageFormat = new Map<ImageFormatMimeType, ImageFormat>(
  Array.from(ImageFormatMimeTypes.entries()).map(([a,b]) => [b,a])
);
