// Native payments — lazy-loaded so web never touches react-native-purchases
import { useState, useEffect } from 'react';
import { Platform } from 'react-native';

const ENTITLEMENT_ID = 'Bid Pro Unlimited';

export function getRevenueCatApiKey(): string | undefined {
  if (Platform.OS === 'web') return undefined;
  if (__DEV__ && process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY) {
    return process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY;
  }
  return Platform.select({
    ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
    android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY,
    default: undefined,
  });
}

export async function initializeRevenueCat(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const apiKey = getRevenueCatApiKey();
  if (!apiKey) { console.warn('[RC] No API key'); return false; }
  try {
    const Purchases = (await import('react-native-purchases')).default;
    await Purchases.configure({ apiKey });
    return true;
  } catch (e) {
    console.error('[RC] init error', e);
    return false;
  }
}

export function usePackages() {
  const [packages, setPackages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(Platform.OS !== 'web');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') { setIsLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const Purchases = (await import('react-native-purchases')).default;
        const offerings = await Purchases.getOfferings();
        if (!cancelled) setPackages(offerings.current?.availablePackages ?? []);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Failed to load plans');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const purchasePackage = async (pkg: any) => {
    const Purchases = (await import('react-native-purchases')).default;
    return Purchases.purchasePackage(pkg);
  };

  const restorePurchases = async () => {
    const Purchases = (await import('react-native-purchases')).default;
    return Purchases.restorePurchases();
  };

  return { packages, isLoading, error, purchasePackage, restorePurchases };
}

export function useCustomerInfo() {
  const [customerInfo, setCustomerInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(Platform.OS !== 'web');

  useEffect(() => {
    if (Platform.OS === 'web') { setIsLoading(false); return; }
    let listener: ((info: any) => void) | null = null;
    (async () => {
      try {
        const Purchases = (await import('react-native-purchases')).default;
        const info = await Purchases.getCustomerInfo();
        setCustomerInfo(info);
        listener = (i: any) => setCustomerInfo(i);
        Purchases.addCustomerInfoUpdateListener(listener);
      } catch (e) {
        console.error('[RC] getCustomerInfo error', e);
      } finally {
        setIsLoading(false);
      }
    })();
    return () => {
      if (listener) {
        import('react-native-purchases').then(m => {
          m.default.removeCustomerInfoUpdateListener(listener!);
        });
      }
    };
  }, []);

  const isPro = !!customerInfo?.entitlements?.active?.[ENTITLEMENT_ID];
  return { customerInfo, isLoading, isPro };
}

export async function checkIsPro(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const Purchases = (await import('react-native-purchases')).default;
    const info = await Purchases.getCustomerInfo();
    return !!info.entitlements.active[ENTITLEMENT_ID];
  } catch {
    return false;
  }
}
