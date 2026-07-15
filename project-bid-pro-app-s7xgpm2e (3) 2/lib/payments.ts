// Native payments — lazy-loaded so web never touches react-native-purchases.
//
// Single-tier app: the whole app is locked behind one subscription.
// We do NOT match a specific entitlement name — instead we treat the user as
// "subscribed" if RevenueCat reports ANY active entitlement. This avoids the
// classic silent failure where the entitlement is named slightly differently
// in the RevenueCat dashboard than in code and nothing ever unlocks.
import { useState, useEffect } from 'react';
import { Platform } from 'react-native';

// RevenueCat PUBLIC api keys. These are safe to ship in the app binary
// (that is what "public app-specific" keys are designed for). Env vars, when
// set at build time, take precedence; otherwise we fall back to these.
const REVENUECAT_IOS_KEY = 'appl_KJietmTaGYXOxdHYGAUpZHifguB';
const REVENUECAT_ANDROID_KEY = ''; // add your Google Play key here if/when you ship Android

export function getRevenueCatApiKey(): string | undefined {
  if (Platform.OS === 'web') return undefined;
  if (__DEV__ && process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY) {
    return process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY;
  }
  return Platform.select({
    ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY || REVENUECAT_IOS_KEY,
    android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY || REVENUECAT_ANDROID_KEY || undefined,
    default: undefined,
  });
}

let _configured = false;

// Idempotent RevenueCat configure. Safe to call more than once.
export async function initializeRevenueCat(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  if (_configured) return true;
  const apiKey = getRevenueCatApiKey();
  if (!apiKey) {
    console.warn('[RC] No RevenueCat API key set (EXPO_PUBLIC_REVENUECAT_IOS_API_KEY).');
    return false;
  }
  try {
    const Purchases = (await import('react-native-purchases')).default;
    await Purchases.configure({ apiKey });
    _configured = true;
    return true;
  } catch (e) {
    console.error('[RC] init error', e);
    return false;
  }
}

// True if the customer has any active entitlement at all.
function hasAnyActiveEntitlement(info: any): boolean {
  const active = info?.entitlements?.active;
  return !!active && Object.keys(active).length > 0;
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
        await initializeRevenueCat();
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

// Subscription state for the whole-app gate.
// `hasAccess` (aliased as `isPro` for backward compatibility) is true when the
// customer has any active entitlement.
export function useCustomerInfo() {
  const [customerInfo, setCustomerInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(Platform.OS !== 'web');

  useEffect(() => {
    if (Platform.OS === 'web') { setIsLoading(false); return; }
    let listener: ((info: any) => void) | null = null;
    let cancelled = false;
    (async () => {
      try {
        await initializeRevenueCat();
        const Purchases = (await import('react-native-purchases')).default;
        const info = await Purchases.getCustomerInfo();
        if (!cancelled) setCustomerInfo(info);
        listener = (i: any) => setCustomerInfo(i);
        Purchases.addCustomerInfoUpdateListener(listener);
      } catch (e) {
        console.error('[RC] getCustomerInfo error', e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      if (listener) {
        import('react-native-purchases').then(m => {
          m.default.removeCustomerInfoUpdateListener(listener!);
        });
      }
    };
  }, []);

  const hasAccess = hasAnyActiveEntitlement(customerInfo);
  return { customerInfo, isLoading, isPro: hasAccess, hasAccess };
}

export async function checkIsPro(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    await initializeRevenueCat();
    const Purchases = (await import('react-native-purchases')).default;
    const info = await Purchases.getCustomerInfo();
    return hasAnyActiveEntitlement(info);
  } catch {
    return false;
  }
}
