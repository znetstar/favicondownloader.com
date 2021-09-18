
export enum ImageFormat {
  png  = 'png',
  jpeg = 'jpeg',
  gif = 'gif',
  tiff  = 'tiff',
  bmp = 'bmp'
}
export const ImageFormatMimeTypes = new Map<ImageFormat, string>(
  [
    [ ImageFormat.jpeg, 'image/jpeg' ],
    [ ImageFormat.png, 'image/png' ],
    // [ ImageFormat.svg, 'image/svg+xml' ],
    // [ ImageFormat.ico, 'image/x-icon' ],
    [ ImageFormat.gif, 'image/gif' ],
    [ ImageFormat.tiff, 'image/tiff' ],
    [ ImageFormat.bmp, 'image/bmp' ],
    // [ ImageFormat.heic, 'image/heic' ],
    // [ ImageFormat.pdf, 'application/pdf' ],
  ]
)
export const MimeTypesImageFormat = new Map<string, ImageFormat>(
  Array.from(ImageFormatMimeTypes.entries()).map(([a,b]) => [b,a])
);
