// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import * as mime  from 'mime-types';
import { IFavicon } from '../../common/_favicon';
import {ImageFormat, ImageFormatMimeTypes} from "../../common/_imageFormats";

type Data = {
  name: string
}

const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.82 Safari/537.36';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { getFavicon, DEFAULT_MIME_TYPE, DEFAULT_EXPIRE_IN,  Favicon } = await import('../../common/_favicon');

  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET');
    res.end();
    return;
  }
  let host = (req.url as string).split('/')[3];

  if (host)
    host = host.split('?').shift() as string;

  let mimeType = req.headers['accept'] ? mime.contentType((req.headers['accept']) as string) : void(0);
  if (mimeType === '*/*') mimeType = void(0);
  if (mimeType)
    mimeType = mimeType.split(';').shift();

  if (req.query.format) {
    mimeType = ImageFormatMimeTypes.get(req.query.format as ImageFormat) as string;
  }

  if (mimeType && !Array.from(ImageFormatMimeTypes.values()).includes(mimeType)) {
    // res.statusCode = 406;
    // res.end();
    mimeType = void(0);
    // return;
  }

  const favicon = await getFavicon(host, DEFAULT_USER_AGENT, mimeType as string);
  if (favicon) {
    const fv: IFavicon = favicon as unknown as IFavicon;
    res.setHeader('Content-Type', fv.mimeType as string);
    res.setHeader('Content-Length', (fv.image as Buffer).byteLength);
    res.setHeader('Expires', (fv.expireAt as Date).toUTCString());
    res.setHeader('Age', Math.round(((new Date()).getTime()-(fv.updatedAt as Date).getTime())/1e3));
    res.statusCode = 200;
    res.write(fv.image);
    res.end();
  } else {
    res.statusCode = 404;
    res.end();
  }
}
