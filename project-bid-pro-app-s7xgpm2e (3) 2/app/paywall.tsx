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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { brand } from '@/constants/theme';
import { usePackages, useCustomerInfo } from '@/lib/payments';

const ENTITLEMENT_ID = 'Bid Pro Unlimited';

// Detect plan type from RevenueCat package identifier
function getPlanMeta(pkg: any): { label: string; period: string; badge?: string; savings?: string } {
  const id: string = pkg?.identifier ?? '';
  const title: string = pkg?.product?.title ?? '';
  const lower = (id + ' ' + title).toLowerCase();

  if (lower.includes('annual') || lower.includes('yearly') || lower.includes('year')) {
    return {
      label: 'Yearly',
      period: '/year',
      badge: '3-Day Free Trial',
      savings: 'Save 77% · $3.33/mo',
    };
  }
  if (lower.includes('monthly') || lower.includes('month')) {
    return {
      label: 'Monthly',
      period: '/month',
    };
  }
  if (lower.includes('weekly') || lower.includes('week')) {
    return { label: 'Weekly', period: '/week' };
  }
  if (lower.includes('lifetime')) {
    return { label: 'Lifetime', period: '' };
  }
  // Fallback
  return {
    label: pkg?.product?.title ?? 'Plan',
    period: '',
  };
}

export default function PaywallScreen() {
  const { packages, isLoading: packagesLoading, purchasePackage } = usePackages();
  const { isPro } = useCustomerInfo();
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);

  // Auto-select yearly plan (first in list, or find by identifier)
  useEffect(() => {
    if (packages.length > 0) {
      const yearlyIdx = packages.findIndex(p => {
        const id = (p.identifier ?? '').toLowerCase();
        const title = (p.product?.title ?? '').toLowerCase();
        return id.includes('annual') || id.includes('yearly') || title.includes('year');
      });
      setSelectedIdx(yearlyIdx >= 0 ? yearlyIdx : 0);
    }
  }, [packages]);

  // If already pro, show success
  if (isPro) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={28} color={brand.textSecondary} />
        </TouchableOpacity>
        <View style={styles.centered}>
          <Ionicons name="checkmark-circle" size={64} color={brand.success} />
          <Text style={styles.proTitle}>You're Pro!</Text>
          <Text style={styles.proSub}>All features are unlocked</Text>
          <TouchableOpacity style={styles.doneBtn} onPress={() => router.back()} activeOpacity={0.85}>
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handlePurchase = async () => {
    if (packages.length === 0) return;
    setPurchasing(true);
    try {
      const pkg = packages[selectedIdx];
      const result = await purchasePackage(pkg);
      const nowPro = !!result?.customerInfo?.entitlements?.active?.[ENTITLEMENT_ID];
      if (nowPro) {
        Alert.alert('Welcome to Pro!', 'Your subscription is now active. All features are unlocked.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
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
      const mod = await import('react-native-purchases');
      const Purchases = mod.default;
      const info = await Purchases.restorePurchases();
      const nowPro = !!info?.entitlements?.active?.[ENTITLEMENT_ID];
      if (nowPro) {
        Alert.alert('Purchases Restored', 'Your subscription has been restored!', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('Nothing to Restore', "We didn't find any previous purchases on this account.");
      }
    } catch (e: any) {
      console.error('[RC] restore error', e);
      Alert.alert('Restore Failed', e?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setRestoring(false);
    }
  };

  const features = [
    { icon: 'flash' as const, title: 'Truck Logistics', desc: 'Optimize haul routes with mixed fleet planning' },
    { icon: 'calculator' as const, title: 'Unlimited Calculations', desc: 'Save unlimited job estimates and history' },
    { icon: 'trending-up' as const, title: 'Cost Tracking', desc: 'Track material costs and project totals' },
    { icon: 'cloud-download' as const, title: 'Future Updates', desc: 'All future pro features included' },
  ];

  const selectedPkg = packages[selectedIdx];
  const selectedMeta = selectedPkg ? getPlanMeta(selectedPkg) : null;
  const ctaLabel = selectedMeta?.badge
    ? `Start Free Trial`
    : `Subscribe · ${selectedPkg?.product?.priceString ?? ''}`;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Close button */}
      <TouchableOpacity
        style={styles.closeBtn}
        onPress={() => router.back()}
        activeOpacity={0.7}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Ionicons name="close" size={28} color={brand.textSecondary} />
      </TouchableOpacity>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroIconBox}>
            <Ionicons name="diamond" size={40} color={brand.orange} />
          </View>
          <Text style={styles.heroTitle}>Unlock Pro</Text>
          <Text style={styles.heroSub}>
            Get the full Bid Pro Material Calculator experience
          </Text>
        </View>

        {/* Plans */}
        {packagesLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={brand.orange} size="large" />
            <Text style={styles.loadingText}>Loading plans...</Text>
          </View>
        ) : packages.length === 0 ? (
          <View style={styles.loadingBox}>
            <Ionicons name="alert-circle-outline" size={32} color={brand.textTertiary} />
            <Text style={styles.loadingText}>
              {Platform.OS === 'web'
                ? 'In-app purchases are available on iOS and Android only.'
                : 'No plans available. Please try again later.'}
            </Text>
          </View>
        ) : (
          <View style={styles.plansSection}>
            <Text style={styles.plansTitle}>CHOOSE YOUR PLAN</Text>
            {packages.map((pkg, idx) => {
              const meta = getPlanMeta(pkg);
              const selected = idx === selectedIdx;
              return (
                <TouchableOpacity
                  key={pkg.identifier ?? idx}
                  style={[styles.planCard, selected && styles.planCardSelected]}
                  onPress={() => setSelectedIdx(idx)}
                  activeOpacity={0.85}
                >
                  <View style={styles.planRadio}>
                    <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                      {selected && <View style={styles.radioInner} />}
                    </View>
                  </View>
                  <View style={styles.planContent}>
                    <View style={styles.planHeader}>
                      <Text style={styles.planLabel}>{meta.label}</Text>
                      {meta.badge && (
                        <View style={styles.planBadge}>
                          <Text style={styles.planBadgeText}>{meta.badge}</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.planPriceRow}>
                      <Text style={styles.planPrice}>{pkg.product?.priceString}</Text>
                      <Text style={styles.planPeriod}>{meta.period}</Text>
                    </View>
                    {meta.savings && (
                      <Text style={styles.planSavings}>{meta.savings}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Features */}
        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>WHAT YOU GET</Text>
          {features.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.featureIconBox}>
                <Ionicons name={f.icon} size={20} color={brand.orange} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
              <Ionicons name="checkmark-circle" size={22} color={brand.success} />
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottom}>
        <TouchableOpacity
          style={[styles.buyBtn, (purchasing || packages.length === 0) && styles.buyBtnDisabled]}
          onPress={handlePurchase}
          activeOpacity={0.85}
          disabled={purchasing || packages.length === 0}
        >
          {purchasing ? (
            <ActivityIndicator color="#000" size="small" />
          ) : (
            <>
              <Ionicons name="diamond" size={20} color="#000" />
              <Text style={styles.buyBtnText}>{ctaLabel}</Text>
            </>
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
          Cancel anytime. Payment charged to your account at confirmation.{' '}
          {selectedMeta?.badge ? 'Free trial for 3 days, then subscription begins.' : ''}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: brand.bg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  closeBtn: {
    position: 'absolute', top: 16, right: 16, zIndex: 10,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: brand.bgCard, alignItems: 'center', justifyContent: 'center',
  },
  proTitle: { fontSize: 28, fontWeight: '900', color: brand.textPrimary, marginTop: 16 },
  proSub: { fontSize: 15, color: brand.textSecondary, marginTop: 8 },
  doneBtn: {
    backgroundColor: brand.orange, borderRadius: 14, paddingHorizontal: 32,
    paddingVertical: 14, marginTop: 24,
  },
  doneBtnText: { fontSize: 16, fontWeight: '800', color: '#000' },

  scroll: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 20 },

  // Hero
  hero: { alignItems: 'center', marginTop: 24, marginBottom: 28 },
  heroIconBox: {
    width: 80, height: 80, borderRadius: 20,
    backgroundColor: 'rgba(249,115,22,0.15)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  heroTitle: { fontSize: 32, fontWeight: '900', color: brand.textPrimary, letterSpacing: -0.5 },
  heroSub: { fontSize: 15, color: brand.textSecondary, marginTop: 8, textAlign: 'center', lineHeight: 22 },

  // Loading
  loadingBox: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  loadingText: { fontSize: 14, color: brand.textTertiary },

  // Plans
  plansSection: { marginBottom: 28 },
  plansTitle: { fontSize: 11, fontWeight: '800', color: brand.textTertiary, letterSpacing: 2, marginBottom: 16, marginLeft: 4 },
  planCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: brand.bgCard, borderRadius: 16,
    borderWidth: 2, borderColor: brand.border,
    padding: 18, marginBottom: 12,
  },
  planCardSelected: { borderColor: brand.orange },
  planRadio: { paddingRight: 4 },
  radioOuter: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: brand.textTertiary,
    alignItems: 'center', justifyContent: 'center',
  },
  radioOuterSelected: { borderColor: brand.orange },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: brand.orange },
  planContent: { flex: 1 },
  planHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  planLabel: { fontSize: 16, fontWeight: '800', color: brand.textPrimary },
  planBadge: {
    backgroundColor: brand.orange, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  planBadgeText: { fontSize: 10, fontWeight: '800', color: '#000', letterSpacing: 0.5 },
  planPriceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  planPrice: { fontSize: 22, fontWeight: '900', color: brand.orange },
  planPeriod: { fontSize: 14, fontWeight: '600', color: brand.textSecondary },
  planSavings: { fontSize: 12, fontWeight: '600', color: brand.success, marginTop: 4 },

  // Features
  featuresSection: { marginBottom: 16 },
  featuresTitle: { fontSize: 11, fontWeight: '800', color: brand.textTertiary, letterSpacing: 2, marginBottom: 16, marginLeft: 4 },
  featureRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: brand.bgCard, borderRadius: 14,
    padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: brand.border,
  },
  featureIconBox: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: 'rgba(249,115,22,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  featureContent: { flex: 1 },
  featureTitle: { fontSize: 15, fontWeight: '700', color: brand.textPrimary },
  featureDesc: { fontSize: 12, color: brand.textTertiary, marginTop: 2 },

  // Bottom CTA
  bottom: {
    padding: 20, paddingBottom: Platform.OS === 'web' ? 20 : 34, gap: 10,
  },
  buyBtn: {
    backgroundColor: brand.orange, borderRadius: 14, height: 56,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    shadowColor: brand.orange, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  buyBtnDisabled: { opacity: 0.6 },
  buyBtnText: { fontSize: 17, fontWeight: '800', color: '#000', letterSpacing: 1 },
  restoreBtn: { alignItems: 'center', paddingVertical: 10 },
  restoreBtnText: { fontSize: 14, fontWeight: '600', color: brand.textSecondary },
  legalText: {
    fontSize: 11, color: brand.textTertiary, textAlign: 'center',
    lineHeight: 16, paddingHorizontal: 16,
  },
});
