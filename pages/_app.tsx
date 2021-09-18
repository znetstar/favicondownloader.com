import '../styles/globals.scss'
import '@fontsource/roboto'
import "@fontsource/poppins"
import type { AppProps } from 'next/app'

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}
export default MyApp
