import { AppProps } from 'next/app';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import { QueryClient, QueryClientProvider } from 'react-query';
import { appWithTranslation } from 'next-i18next';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { getBrowserLanguage, getUserPreferredLanguage } from '../utils/language';
import theme from '../styles/theme';
import Layout from '../components/Layout';

const queryClient = new QueryClient();

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Only run on the client side and on initial mount
    if (typeof window !== 'undefined' && isInitialMount.current) {
      isInitialMount.current = false;

      // Check for user's preferred language first
      const userPreferred = getUserPreferredLanguage();
      if (userPreferred && router.locale !== userPreferred) {
        const { pathname, asPath, query } = router;
        router.push({ pathname, query }, asPath, { locale: userPreferred });
        return;
      }

      // If no user preference, use browser language
      const browserLang = getBrowserLanguage();
      if (router.locale !== browserLang) {
        const { pathname, asPath, query } = router;
        router.push({ pathname, query }, asPath, { locale: browserLang });
      }
    }
  }, [router.locale]); // Only depend on router.locale changes

  return (
    <QueryClientProvider client={queryClient}>
      <PayPalScriptProvider options={{
        'client-id': process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
      }}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </ThemeProvider>
      </PayPalScriptProvider>
    </QueryClientProvider>
  );
}

export default appWithTranslation(MyApp); 