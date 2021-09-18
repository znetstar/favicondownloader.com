import {Document, Schema} from 'mongoose';
import mongoose from './_database';
import {URL} from 'url';
import fetch from 'node-fetch';
import cheerio from 'cheerio';
import * as _ from 'lodash';

import {LRUMap} from 'lru_map';
import sharp, {Metadata} from 'sharp';
import {ImageFormat, ImageFormatMimeTypes, MimeTypesImageFormat} from "./_imageFormats";
const icoToPng = require('ico-to-png');
export interface IFavicon  {
  mimeType: string;
  host: string;
  image: Buffer;
  expireAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  userAgent: string;
  parent?: boolean;
}


export const DEFAULT_EXPIRE_IN = process.env.DEFAULT_EXPIRE_IN ?  Number(process.env.DEFAULT_EXPIRE_IN) : 86400e3;
export const MAX_EXPIRE_IN = process.env.MAX_EXPIRE_IN ?  Number(process.env.MAX_EXPIRE_IN) : 86400e3*30;
export const DEFAULT_MIME_TYPE = process.env.DEFAULT_MIME_TYPE ?  String(process.env.DEFAULT_MIME_TYPE) : 'image/png';
export const MAX_IMAGE_WIDTH = process.env.MAX_IMAGE_WIDTH ? Number(process.env.MAX_IMAGE_WIDTH) : 228;

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
  },
  parent:  {
    type: Boolean,
    required: true
  }
}, {  timestamps: true });
export class HTTPError extends Error {
  constructor(public httpCode: number, message?: string) {
    super(message || `HTTP error, code ${httpCode}`);
  }
}

type FaviconCandidate = { expireAt?: Date, image: Buffer, meta: Metadata }|null;


const metaCache = new LRUMap(1000);
type MetaEntry = {
  image: Buffer,
  meta: Metadata
}

export async function processMeta(id: string, buf: Buffer, inputMime?: string): Promise<MetaEntry|false> {
  try {
    if (inputMime && ['image/vnd.microsoft.icon', 'image/x-icon'].includes(inputMime)) {
      buf = await icoToPng(buf, MAX_IMAGE_WIDTH);
      inputMime = 'image/png';
    }
  } catch (err) {
    console.error((err as any).stack);
  }

  let metaEntry: MetaEntry|undefined = metaCache.get(id) as MetaEntry|undefined;
  const newMeta = await sharp(buf).metadata();
  if (metaEntry && ((metaEntry as MetaEntry).meta.width as number) > (newMeta.width as number)) {
    return false;
  } else {
      metaEntry = {
      image: buf,
      meta: newMeta
    };
    metaCache.set(id, { meta: newMeta });

    return metaEntry;
  }
}

export async function ensureImageFormat(inBuf: Buffer, mimeType: string, id: string,inputMime?: string): Promise<Buffer|null> {
  try {


    const format = (MimeTypesImageFormat.get(mimeType) as ImageFormat).toString();

    let formatOpts: any;

    if (format === 'webp' || format === 'lossless')
      formatOpts = { lossless: true };
    else if (format === 'jpeg' || format === 'gif' || format  === 'tiff' || format === 'png')
      formatOpts = { quality: 100 };

    const metaEntry = await  processMeta(id, inBuf, inputMime);

    if (!metaEntry) return null;
    const { image: buf }  = metaEntry;

    // @ts-ignore
    return sharp(buf)
      // @ts-ignore
      .resize({ width: MAX_IMAGE_WIDTH })
      [format](formatOpts)
      .toBuffer()
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

    let rawImage = Buffer.from(await imageResp.arrayBuffer());

    const inputMime =  imageResp.headers.get('content-type') || void(0);

    const metaEntry = await processMeta(id, rawImage, inputMime);

    if (!metaEntry) return null;
    const { image, meta } = metaEntry;

    return {
      expireAt,
      image,
      meta
    }
  } catch (err)  {
    console.error((err as any).stack);
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
  const candidates = await Promise.all<FaviconCandidate[]|null|FaviconCandidate>([
    (async (): Promise<FaviconCandidate[]|null> => {
      try {
        const {pageText,url} = await getPageText();

        const $ = cheerio.load(pageText);

        const linkIcons = _.flatten(['[rel~="apple-touch-icon"]', '[rel~="icon"]'].map((selector) => Array.from($(selector)))).filter(Boolean);
        const lis = Array.from(linkIcons).sort((a,b) => {

          try {
            if (!$(b).attr('sizes') || !$(a).attr('sizes')) return 0;
            let bb = Number(($(b).attr('sizes') as string).split('x').shift());
            let aa = Number(($(a).attr('sizes') as string).split('x').shift());

            return bb - aa;
          } catch (er) {  return 0; }
        })

        const results: FaviconCandidate[] = await Promise.all(lis.map((icon) => {
          try {
            let linkUrl = $(icon).attr('href');
            if (!linkUrl) return null;
            if (linkUrl[0] === '/') {
              linkUrl = url.protocol + '//' + url.host + linkUrl;
            }

            return extractFaviconFromUrl(linkUrl, mimeType, id, userAgent);
          } catch (err) { return null; }
        }));

        return results;
      } catch (err) {
        console.error((err as any).stack);
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
        console.error((err as any).stack);
        return null;
      }
    })(),
    (async (): Promise<FaviconCandidate> => {
      try {
        return extractFaviconFromUrl(
          inputUrl.protocol + '//' + inputUrl.host +  '/favicon.ico', mimeType, id,userAgent
        );
      } catch (err) {
        console.error((err as any).stack);
        return null;
      }
    })()
  ]);

  const cands = _.flatten(candidates).filter((i) => i && i.image).sort((a,b)=> {
    return (b?.meta.width ||0) - (a?.meta.width ||0);
  });
  if (cands.length) {
    for (const candidate of cands) {
      if (!candidate) continue;

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
  host = host.toLowerCase();
  const parent = [ 'image/webp', 'image/png', 'image/avif' ].includes(mimeType);
  const id = [  host ].join(':');
  let favicon: Document<IFavicon>&IFavicon|null = await Favicon.findOne( {
    host,
    mimeType,
    userAgent
  });

  if (favicon)
    return favicon;

  favicon = await Favicon.findOne({
    host,
    parent: true,
    userAgent
  });


  if (favicon) {
    const newImage = await ensureImageFormat(favicon.image, mimeType, id, favicon.mimeType);
    const existingDoc: any = favicon.toObject();
    delete existingDoc._id;

    const newFavicon = await Favicon.create({
      ...existingDoc,
      createdAt: new Date(),
      updatedAt: new  Date(),
      image: newImage,
      mimeType,
      parent: false
    });

    return newFavicon;
  }
  else {
    let favicon = await extractFaviconFromPage(`https://${host}`, mimeType, id, userAgent) || await extractFaviconFromPage(`http://${host}`, mimeType, id, userAgent) || null;

    if (!favicon)
      return null;

    const newImage = await ensureImageFormat(favicon.image, mimeType, id, favicon.mimeType);

    if (!newImage)
      return null;

    const newFavicon = await Favicon.create({
      ...favicon,
      image: newImage,
      parent
    });

    return newFavicon;
  }
}

FaviconSchema.pre<IFavicon>('save', async function () {

});

FaviconSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });
FaviconSchema.index({ host: 1, mimeType: 1 }, { unique: true });
FaviconSchema.index({ host: 1, parent: 1 } );
FaviconSchema.index({ host: 1, createdAt: 1 });

export const Favicon = (global as any).Favicon = (global as any).Favicon || mongoose.model('Favicon', FaviconSchema);
export default Favicon;
