import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import './reactCOIServiceWorker';
import ErrorBoundary from '@/components/errorBoundary';

export default function App({ Component, pageProps }: AppProps) {

  return (<ErrorBoundary>
    <Component {...pageProps} />
  </ErrorBoundary>);
}
