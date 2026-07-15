import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, View, ActivityIndicator, StyleSheet } from 'react-native';
import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BlinkProvider, createTamagui, tamaguiDefaultConfig, Theme, BlinkToastProvider } from '@blinkdotnew/mobile-ui';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useCustomerInfo, initializeRevenueCat } from '@/lib/payments';
import { Paywall } from '@/components/Paywall';
import { brand } from '@/constants/theme';

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

/**
 * Subscription gate.
 *
 * Single-tier hard paywall: the entire app is locked until the user has an
 * active subscription. Three states:
 *   1. loading  -> splash spinner while RevenueCat resolves customer info
 *   2. no access -> full-screen Paywall (no dismiss)
 *   3. access   -> the real app (tab navigator + flows)
 *
 * On web there are no purchases; we show the app so the marketing/preview site
 * still renders, but native purchase flows are unavailable there.
 */
function Gate({ children }: { children: React.ReactNode }) {
  const { hasAccess, isLoading } = useCustomerInfo();

  // Web is a preview surface with no IAP — don't lock it behind a paywall.
  if (Platform.OS === 'web') return <>{children}</>;

  if (isLoading) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={brand.orange} />
      </View>
    );
  }

  if (!hasAccess) {
    return <Paywall />;
  }

  return <>{children}</>;
}

export default function RootLayout() {
  useFrameworkReady();

  useEffect(() => {
    if (Platform.OS !== 'web') {
      initializeRevenueCat().catch(() => {});
    }
  }, []);

  return (
    <BlinkProvider config={config} defaultTheme="dark">
      <Theme name="dark">
        <QueryClientProvider client={queryClient}>
          <BlinkToastProvider>
            <WebStyleReset />
            <Gate>
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
                <Stack.Screen name="+not-found" />
              </Stack>
            </Gate>
            <StatusBar style="light" backgroundColor="#0A0A0A" />
          </BlinkToastProvider>
        </QueryClientProvider>
      </Theme>
    </BlinkProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: brand.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
