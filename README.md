[getfavicon.io](https://getfavicon.io) is a minimalistic next.js favicon downloader.

## Usage

For the web ui navigate to the homepage at [`https://getfavicon.io`](https://getfavicon.io).

For the API: [`https://getfavicon.io/api/favicon/reason.com?format=png`](https://getfavicon.io/api/favicon/reason.com?format=png).

You can change `reason.com` to any domain, and `format=png` to any of the formats below
```typescript
export enum ImageFormat {
  png  = 'png',
  jpeg = 'jpeg',
  gif = 'gif',
  tiff  = 'tiff',
  bmp = 'bmp'
}
```

## Install and Run

Install with `npm install` and run with `npm start`.
