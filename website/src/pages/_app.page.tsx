import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import './reactCOIServiceWorker';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function App({ Component, pageProps }: AppProps) {

  return (<ErrorBoundary>
    <Component {...pageProps} />
  </ErrorBoundary>);
}
