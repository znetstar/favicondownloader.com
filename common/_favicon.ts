import {Document, Schema} from 'mongoose';
import mongoose from './_database';
import {URL} from 'url';
import fetch from 'node-fetch';
import cheerio from 'cheerio';
import * as _ from 'lodash';

import {LRUMap} from 'lru_map';
import GM from 'gm';
import {ImageFormat, ImageFormatMimeTypes, MimeTypesImageFormat} from "./_imageFormats";
const icoToPng = require('ico-to-png');
const gm = GM.subClass({  })
export interface IFavicon  {
  mimeType: string;
  host: string;
  image: Buffer;
  expireAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  userAgent: string;
}

export const DEFAULT_EXPIRE_IN = process.env.DEFAULT_EXPIRE_IN ?  Number(process.env.DEFAULT_EXPIRE_IN) : 86400e3;
export const MAX_EXPIRE_IN = process.env.MAX_EXPIRE_IN ?  Number(process.env.MAX_EXPIRE_IN) : 86400e3*30;
export const DEFAULT_MIME_TYPE = process.env.DEFAULT_MIME_TYPE ?  String(process.env.DEFAULT_MIME_TYPE) : 'image/png';
export const MAX_IMAGE_WIDTH = process.env.MAX_IMAGE_WIDTH ? Number(process.env.MAX_IMAGE_WIDTH) : 128;




export const FaviconSchema =  new Schema<IFavicon>({
  mimeType: {
    type: String,
    required: true,
    enum: Array.from(ImageFormatMimeTypes.values())
  },
  host: {
    type: String,
    required: true
  },
  image: {
    type: Schema.Types.Buffer,
    required: false
  },
  expireAt:  {
    type: Date,
    required: false,
    default: () => (new Date( (new Date()).getTime() + DEFAULT_EXPIRE_IN ))
  },
  createdAt:  {
    type: Date,
    required: false
  },
  updatedAt:  {
    type: Date,
    required: false
  },
  userAgent:  {
    type: String,
    required: true
  }
}, {  timestamps: true });
export class HTTPError extends Error {
  constructor(public httpCode: number, message?: string) {
    super(message || `HTTP error, code ${httpCode}`);
  }
}

type FaviconCandidate = { expireAt?: Date, image: Buffer }|null;

export async function ensureImageFormat(buf: Buffer, mimeType: string, id: string,inputMime?: string): Promise<Buffer|null> {
  try {
    let image: Buffer;

    if (inputMime === 'image/x-icon') {
      buf = await icoToPng(buf, MAX_IMAGE_WIDTH);
      inputMime = 'image/png';
    }

    image = await new Promise<Buffer>((resolve, reject) => {
      const format = (MimeTypesImageFormat.get(mimeType) as ImageFormat).toString();
      gm(buf)
        .resize(MAX_IMAGE_WIDTH)
        .toBuffer(format, (err: Error|null, outBuf: Buffer) => {
          if (err) reject(err);
          else resolve(outBuf);
        });
    });

    return image;
  } catch (err) {
    throw err;
  }
}

export async function extractFaviconFromUrl(url: string, mimeType: string, id: string, userAgent: string): Promise<FaviconCandidate>  {
  try {
    const imageResp = await fetch(url, {
      headers: {
        'User-Agent':  userAgent
      }
    });

    if (imageResp.status !== 200)
      return null;

    let expireAt: Date | undefined;
    const cacheControl = imageResp.headers.get('cache-control');
    if (cacheControl) {
      const ccAge = _.get(cacheControl.match(/max-age\=(\d+)/), '1');
      if (ccAge && !isNaN(ccAge)) {
        const expiresIn = Number(ccAge);
        expireAt = new Date((new Date()).getTime() + (expiresIn * 1e3));
      }
    }
    const expiresStr = imageResp.headers.get('expires');
    if (typeof (expireAt) === 'undefined' && expiresStr) {
      const httpExpires = new Date(expiresStr);
      if (httpExpires)
        expireAt = httpExpires;
    }

    const rawImage = Buffer.from(await imageResp.arrayBuffer());
    const image = await ensureImageFormat(rawImage, mimeType, id, imageResp.headers.get('content-type') || void(0));
    if (!image) return null;

    return {
      expireAt,
      image
    }
  } catch (err)  {
    return  null;
  }
}

export async function extractFaviconFromPage(href: string, mimeType: string = DEFAULT_MIME_TYPE, id: string, userAgent: string): Promise<IFavicon|null> {
  let pageText: string;
  let destUrl: string;
  let url: URL;
  const getPageText = async () => {
    if (!pageText || !url) {
      const pageResp = await fetch(href,{
        headers: {
          'User-Agent':  userAgent
        }
      });

      if (pageResp.status !== 200) {
        throw new HTTPError(pageResp.status);
      }

      destUrl = pageResp.url;
      url = new URL(destUrl);
      pageText = await pageResp.text();
    }

    return {pageText,url};
  }
  const inputUrl = new URL(href);
  const candidates = await Promise.all<FaviconCandidate>([
    (async (): Promise<FaviconCandidate> => {
      try {
        const {pageText,url} = await getPageText();

        const $ = cheerio.load(pageText);

        const linkIcons = _.flatten(['[rel~="apple-touch-icon"]', '[rel~="icon"]'].map((selector) => $(selector))).filter(Boolean);
        for (let icon of Array.from(linkIcons)) {
          let linkUrl = $(icon).attr('href');
          if (!linkUrl) continue;
          if (linkUrl[0] === '/') {
            linkUrl = url.protocol + '//' + url.host + linkUrl;
          }

          return extractFaviconFromUrl(linkUrl, mimeType, id, userAgent);
        }
        return null;
      } catch (err) {
        return null;
      }
    })(),
    (async (): Promise<FaviconCandidate> => {
      try {
        const {url} = await getPageText();

        return extractFaviconFromUrl(
          url.protocol + '//' + url.host +  '/favicon.ico', mimeType, id,userAgent
        );
      } catch (err) {
        return null;
      }
    })(),
    (async (): Promise<FaviconCandidate> => {
      try {
        return extractFaviconFromUrl(
          inputUrl.protocol + '//' + inputUrl.host +  '/favicon.ico', mimeType, id,userAgent
        );
      } catch (err) {
        return null;
      }
    })()
  ]);

  if (candidates.length) {
    for (const candidate of candidates) {
      if  (candidate === null) continue;


      if (candidate.expireAt && (
        (new Date(candidate.expireAt)).getTime() > (new Date()).getTime() + MAX_EXPIRE_IN
      )) {
        candidate.expireAt = new Date((new Date()).getTime() + MAX_EXPIRE_IN);
      }

      return {
        mimeType,
        host: inputUrl.host,
        userAgent,
        ...candidate
      }
    }
  }

  return null;
}



export async function getFavicon(host: string, userAgent: string, mimeType: string = DEFAULT_MIME_TYPE): Promise<Document<IFavicon>&IFavicon|null> {
  const id = '1';
  let favicon: Document<IFavicon>&IFavicon|null = await Favicon.findOne({
    host,
    mimeType
  });

  if (favicon)
    return favicon;
  /*else if (favicon && process.env.ALLOW_COPY_CONVERT) {
    const newImage = await ensureImageFormat(favicon.image, mimeType, '', favicon.mimeType);
    const existingDoc: any = favicon.toObject();
    delete existingDoc._id;
    const newFavicon = await Favicon.create({
      ...existingDoc,
      createdAt: new Date(),
      updatedAt: new  Date(),
      image: newImage,
      mimeType
    });

    return newFavicon;
  } */
  else {
    const [secure, nonSecure] = await Promise.all<IFavicon|null>([
      extractFaviconFromPage(`https://${host}`, mimeType, id, userAgent),
      extractFaviconFromPage(`http://${host}`, mimeType, id, userAgent)
    ])

    if (!secure && !nonSecure)
      return null;

    const newFavicon = await Favicon.create(secure || nonSecure);

    return newFavicon;
  }
}

FaviconSchema.pre<IFavicon>('save', async function () {

});

FaviconSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });
FaviconSchema.index({ host: 1, mimeType: 1 }, { unique: true });
FaviconSchema.index({ host: 1, createdAt: 1 });

export const Favicon = (global as any).Favicon = (global as any).Favicon || mongoose.model('Favicon', FaviconSchema);
export default Favicon;
