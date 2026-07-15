import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BlinkProvider, createTamagui, tamaguiDefaultConfig, Theme, BlinkToastProvider } from '@blinkdotnew/mobile-ui';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

const config = createTamagui(tamaguiDefaultConfig);

function WebStyleReset() {
  if (Platform.OS !== 'web') return null;
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
          input:focus,textarea:focus{outline:none!important}
          html, body, #root { height: 100%; background: #0A0A0A; }
          @media (min-width: 500px) {
            #root > div { display: flex; justify-content: center; align-items: flex-start; min-height: 100%; background: #111; }
            #root > div > div { width: 100%; max-width: 430px; min-height: 100vh; position: relative; overflow: hidden; box-shadow: 0 0 80px rgba(0,0,0,0.9); }
          }
          @media (max-width: 499px) {
            html, body, #root, #root > div, #root > div > div { width: 100% !important; max-width: 100% !important; overflow-x: hidden; }
          }
        `,
      }}
    />
  );
}

export default function RootLayout() {
  useFrameworkReady();

  useEffect(() => {
    if (Platform.OS !== 'web') {
      import('@/lib/payments').then(m => m.initializeRevenueCat()).catch(() => {});
    }
  }, []);

  return (
    <BlinkProvider config={config} defaultTheme="dark">
      <Theme name="dark">
        <QueryClientProvider client={queryClient}>
          <BlinkToastProvider>
            <WebStyleReset />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen
                name="calculating"
                options={{
                  animation: 'fade',
                  animationDuration: 180,
                  gestureEnabled: false,
                }}
              />
              <Stack.Screen
                name="result"
                options={{
                  animation: 'fade',
                  animationDuration: 220,
                }}
              />
              <Stack.Screen
                name="logistics"
                options={{
                  animation: 'slide_from_right',
                  animationDuration: 240,
                }}
              />
              <Stack.Screen
                name="paywall"
                options={{
                  animation: 'slide_from_bottom',
                  animationDuration: 300,
                  presentation: 'modal',
                }}
              />
              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style="light" backgroundColor="#0A0A0A" />
          </BlinkToastProvider>
        </QueryClientProvider>
      </Theme>
    </BlinkProvider>
  );
}
