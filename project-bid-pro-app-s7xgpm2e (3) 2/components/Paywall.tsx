import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { brand } from '@/constants/theme';
import { usePackages } from '@/lib/payments';

const PRIVACY_URL = 'https://bidproapp.ca/privacy';
const TERMS_URL = 'https://bidproapp.ca/terms';

/**
 * Hard paywall for a single-tier app.
 *
 * The whole app is locked until the user subscribes. There is intentionally
 * NO dismiss/close affordance: the only ways forward are Subscribe or Restore.
 *
 * Offer:
 *  - Yearly:  3-day free trial, then $39.99 / year
 *  - Monthly: $14.99 / month, billed immediately (no trial)
 *
 * Prices/trial come from RevenueCat/App Store at runtime — the copy below is a
 * fallback for display only. Configure the actual product prices and the
 * 3-day intro trial on the yearly product in App Store Connect + RevenueCat.
 */

type PlanKind = 'annual' | 'monthly' | 'other';

function classifyPackage(pkg: any): PlanKind {
  const id: string = pkg?.identifier ?? '';
  const title: string = pkg?.product?.title ?? '';
  const lower = (id + ' ' + title).toLowerCase();
  if (lower.includes('annual') || lower.includes('yearly') || lower.includes('year')) return 'annual';
  if (lower.includes('month')) return 'monthly';
  return 'other';
}

function hasFreeTrial(pkg: any): boolean {
  // RevenueCat exposes an intro price with price 0 for free trials.
  const intro = pkg?.product?.introPrice;
  if (!intro) return false;
  return intro.price === 0 || intro.priceString === '$0.00' || intro.periodNumberOfUnits > 0 && intro.price === 0;
}

export function Paywall() {
  const { packages, isLoading, error, purchasePackage, restorePurchases } = usePackages();
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);

  // Order packages annual-first so the trial option leads.
  const ordered = React.useMemo(() => {
    const withIdx = packages.map((p, i) => ({ p, i }));
    const rank = (p: any) => {
      const k = classifyPackage(p);
      return k === 'annual' ? 0 : k === 'monthly' ? 1 : 2;
    };
    return withIdx.sort((a, b) => rank(a.p) - rank(b.p)).map(x => x.p);
  }, [packages]);

  useEffect(() => {
    if (ordered.length > 0) setSelectedIdx(0);
  }, [ordered.length]);

  const handlePurchase = async () => {
    if (ordered.length === 0) return;
    setPurchasing(true);
    try {
      const pkg = ordered[selectedIdx];
      await purchasePackage(pkg);
      // No navigation needed: the customer-info listener in the gate flips
      // access to true and the app renders automatically.
    } catch (e: any) {
      if (e?.userCancelled) return;
      console.error('[RC] purchase error', e);
      Alert.alert('Purchase Failed', e?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      await restorePurchases();
      // If restore grants access, the gate re-renders. If not, tell the user.
      const mod = await import('react-native-purchases');
      const info = await mod.default.getCustomerInfo();
      const active = info?.entitlements?.active;
      const hasAccess = !!active && Object.keys(active).length > 0;
      if (!hasAccess) {
        Alert.alert('Nothing to Restore', "We didn't find an active subscription on this Apple ID.");
      }
    } catch (e: any) {
      console.error('[RC] restore error', e);
      Alert.alert('Restore Failed', e?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setRestoring(false);
    }
  };

  const selectedPkg = ordered[selectedIdx];
  const selectedKind = selectedPkg ? classifyPackage(selectedPkg) : 'other';
  const selectedTrial = selectedPkg ? hasFreeTrial(selectedPkg) : false;
  const ctaLabel = selectedTrial ? 'Start 3-Day Free Trial' : (selectedPkg?.product?.priceString ? `Subscribe · ${selectedPkg.product.priceString}` : 'Subscribe');

  const features = [
    'Concrete, gravel & aggregate calculators',
    'Truck logistics & load planning',
    'Save unlimited job estimates',
    'Material cost & project totals',
    'All future updates included',
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroIconBox}>
            <Ionicons name="calculator" size={40} color={brand.orange} />
          </View>
          <Text style={styles.heroTitle}>Bid Pro Material Calculator</Text>
          <Text style={styles.heroSub}>
            Full access to every calculator and tool. Subscribe to get started.
          </Text>
        </View>

        {/* Features */}
        <View style={styles.featuresSection}>
          {features.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={20} color={brand.success} />
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </View>

        {/* Plans */}
        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={brand.orange} size="large" />
            <Text style={styles.loadingText}>Loading plans…</Text>
          </View>
        ) : ordered.length === 0 ? (
          <View style={styles.loadingBox}>
            <Ionicons name="alert-circle-outline" size={32} color={brand.textTertiary} />
            <Text style={styles.loadingText}>
              {Platform.OS === 'web'
                ? 'Subscriptions are available in the iOS app.'
                : (error ?? 'Plans are unavailable right now. Please try again shortly.')}
            </Text>
          </View>
        ) : (
          <View style={styles.plansSection}>
            {ordered.map((pkg, idx) => {
              const kind = classifyPackage(pkg);
              const trial = hasFreeTrial(pkg);
              const selected = idx === selectedIdx;
              const label = kind === 'annual' ? 'Yearly' : kind === 'monthly' ? 'Monthly' : (pkg.product?.title ?? 'Plan');
              const period = kind === 'annual' ? '/year' : kind === 'monthly' ? '/month' : '';
              return (
                <TouchableOpacity
                  key={pkg.identifier ?? idx}
                  style={[styles.planCard, selected && styles.planCardSelected]}
                  onPress={() => setSelectedIdx(idx)}
                  activeOpacity={0.85}
                >
                  <View style={styles.radioOuter}>
                    {selected && <View style={styles.radioInner} />}
                  </View>
                  <View style={styles.planContent}>
                    <View style={styles.planHeader}>
                      <Text style={styles.planLabel}>{label}</Text>
                      {trial && (
                        <View style={styles.planBadge}>
                          <Text style={styles.planBadgeText}>3-DAY FREE TRIAL</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.planPriceRow}>
                      <Text style={styles.planPrice}>{pkg.product?.priceString}</Text>
                      <Text style={styles.planPeriod}>{period}</Text>
                    </View>
                    {kind === 'annual' && (
                      <Text style={styles.planSavings}>Best value</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* CTA */}
        <TouchableOpacity
          style={[styles.buyBtn, (purchasing || ordered.length === 0) && styles.buyBtnDisabled]}
          onPress={handlePurchase}
          activeOpacity={0.85}
          disabled={purchasing || ordered.length === 0}
        >
          {purchasing ? (
            <ActivityIndicator color="#000" size="small" />
          ) : (
            <Text style={styles.buyBtnText}>{ctaLabel}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.restoreBtn}
          onPress={handleRestore}
          activeOpacity={0.7}
          disabled={restoring}
        >
          {restoring ? (
            <ActivityIndicator color={brand.textSecondary} size="small" />
          ) : (
            <Text style={styles.restoreBtnText}>Restore Purchases</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.legalText}>
          {selectedKind === 'annual' && selectedTrial
            ? 'Your 3-day free trial starts today. After 3 days, your subscription auto-renews at the yearly price shown until canceled. '
            : 'Your subscription auto-renews at the price shown until canceled. '}
          Payment is charged to your Apple ID. Manage or cancel anytime in your App Store account settings at least 24 hours before renewal.
        </Text>

        <View style={styles.legalLinks}>
          <TouchableOpacity onPress={() => Linking.openURL(TERMS_URL)}>
            <Text style={styles.legalLink}>Terms of Use</Text>
          </TouchableOpacity>
          <Text style={styles.legalDot}>·</Text>
          <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_URL)}>
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: brand.bg },
  scroll: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 40 },

  hero: { alignItems: 'center', marginTop: 24, marginBottom: 24 },
  heroIconBox: {
    width: 80, height: 80, borderRadius: 20,
    backgroundColor: 'rgba(249,115,22,0.15)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  heroTitle: { fontSize: 26, fontWeight: '900', color: brand.textPrimary, textAlign: 'center', letterSpacing: -0.5 },
  heroSub: { fontSize: 15, color: brand.textSecondary, marginTop: 8, textAlign: 'center', lineHeight: 22 },

  featuresSection: { marginBottom: 24, gap: 10 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureText: { fontSize: 15, color: brand.textPrimary, flex: 1 },

  loadingBox: { alignItems: 'center', paddingVertical: 32, gap: 12 },
  loadingText: { fontSize: 14, color: brand.textTertiary, textAlign: 'center', paddingHorizontal: 20, lineHeight: 20 },

  plansSection: { marginBottom: 20 },
  planCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: brand.bgCard, borderRadius: 16,
    borderWidth: 2, borderColor: brand.border,
    padding: 18, marginBottom: 12,
  },
  planCardSelected: { borderColor: brand.orange },
  radioOuter: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: brand.textTertiary,
    alignItems: 'center', justifyContent: 'center',
  },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: brand.orange },
  planContent: { flex: 1 },
  planHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' },
  planLabel: { fontSize: 16, fontWeight: '800', color: brand.textPrimary },
  planBadge: { backgroundColor: brand.orange, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  planBadgeText: { fontSize: 10, fontWeight: '800', color: '#000', letterSpacing: 0.5 },
  planPriceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  planPrice: { fontSize: 22, fontWeight: '900', color: brand.orange },
  planPeriod: { fontSize: 14, fontWeight: '600', color: brand.textSecondary },
  planSavings: { fontSize: 12, fontWeight: '600', color: brand.success, marginTop: 4 },

  buyBtn: {
    backgroundColor: brand.orange, borderRadius: 14, height: 56,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    shadowColor: brand.orange, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8, marginTop: 4,
  },
  buyBtnDisabled: { opacity: 0.6 },
  buyBtnText: { fontSize: 17, fontWeight: '800', color: '#000', letterSpacing: 0.5 },
  restoreBtn: { alignItems: 'center', paddingVertical: 14 },
  restoreBtnText: { fontSize: 14, fontWeight: '600', color: brand.textSecondary },
  legalText: {
    fontSize: 11, color: brand.textTertiary, textAlign: 'center',
    lineHeight: 16, paddingHorizontal: 8, marginTop: 4,
  },
  legalLinks: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 12 },
  legalLink: { fontSize: 12, color: brand.textSecondary, textDecorationLine: 'underline' },
  legalDot: { fontSize: 12, color: brand.textTertiary },
});
