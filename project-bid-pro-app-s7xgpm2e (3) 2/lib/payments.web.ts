// Web stub — react-native-purchases is native only.
// Metro automatically picks this file on web builds.

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
  };
}

export async function checkIsPro(): Promise<boolean> {
  return false;
}
