import Document, {Html, Head, Main, NextScript, DocumentContext} from 'next/document'
import * as React from 'react';
class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx)
    return { ...initialProps }
  }

  render() {
    return (
      <Html>
        <Head>
          {/* Global Site Tag (gtag.js) - Google Analytics */}
          <title>Favicon Downloader</title>
          { process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS ? (
            <React.Fragment>
              <script
                async
                src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS}`}
              ></script>
              <script
                dangerouslySetInnerHTML={{
                  __html: `
                  if (!localStorage.noGA)
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', '${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS}', {
                      page_path: window.location.pathname,
                    });
                 }
              `,
                }} ></script>
            </React.Fragment>
            ) : null }
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument
