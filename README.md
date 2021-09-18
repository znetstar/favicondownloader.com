[getfavicon.io](https://getfavicon.io) is a minimalistic next.js favicon downloader.

## Usage


For the web ui navigate to the homepage at [`https://getfavicon.io`](https://getfavicon.io).

For the API: [`https://getfavicon.io/api/favicon/reason.com?format=png`](https://getfavicon.io/api/favicon/reason.com?format=png).

You can change `reason.com` to any domain, and `format=png` to any of the formats below
```typescript
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
```

## Install and Run

Install with `npm install` and run with `npm start`.

`getfavicon.io` depends on [`sharp`](https://sharp.pixelplumbing.com/) and `libvips`, if you have issues installing either see their respective pages.

## Docker

The docker image created by the `Dockerfile` compiles `libvips` with all the prerequisite.
