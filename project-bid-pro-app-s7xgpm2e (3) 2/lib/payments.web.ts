// Web stub — react-native-purchases is native only.
// Metro automatically picks this file on web builds.
//
// On web there are no in-app purchases, so access is always false. The native
// gate (app/_layout.tsx) treats web as a non-purchasable preview surface.

export function getRevenueCatApiKey(): string | undefined {
  return undefined;
}

export async function initializeRevenueCat(): Promise<boolean> {
  return false;
}

export function usePackages() {
  return {
    packages: [],
    isLoading: false,
    error: null,
    purchasePackage: async () => { throw new Error('Not available on web'); },
    restorePurchases: async () => { throw new Error('Not available on web'); },
  };
}

export function useCustomerInfo() {
  return {
    customerInfo: null,
    isLoading: false,
    isPro: false,
    hasAccess: false,
  };
}

export async function checkIsPro(): Promise<boolean> {
  return false;
}
