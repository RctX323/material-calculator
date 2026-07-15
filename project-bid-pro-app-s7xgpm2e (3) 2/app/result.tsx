import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { brand } from '@/constants/theme';
import { ResultCard } from '@/components/ResultCard';
import { useCalcStore } from '@/lib/calcStore';
import { costPerYardFromUnit } from '@/hooks/useWeightUnit';

/**
 * Page 1 of the result flow.
 * Shows ONLY the calculation result (Order Amount + Cost + Save Calculation button).
 * Truck Logistics lives on a separate page (/logistics) so the user can decide
 * whether to plan their haul AFTER seeing how much they need to order.
 */
export default function ResultScreen() {
  const pending = useCalcStore(s => s.pending);

  // Safety: if a user lands here with no pending result (e.g. deep link, refresh),
  // bounce them back to the calculator instead of showing a blank screen.
  useEffect(() => {
    if (!pending) {
      // Delay one frame to ensure Root Layout is mounted before navigating
      const t = setTimeout(() => {
        router.replace('/(tabs)');
      }, 0);
      return () => clearTimeout(t);
    }
  }, [pending]);

  if (!pending) {
    return <View style={styles.container} />;
  }

  const {
    result,
    materialCostRaw,
    costUnit,
    system,
    onSave,
  } = pending;

  const materialCostPerYard = materialCostRaw
    ? costPerYardFromUnit(materialCostRaw, costUnit, result.cubicYards, result.tons)
    : undefined;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Top bar — back + brand */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="chevron-back" size={26} color={brand.textPrimary} />
        </TouchableOpacity>
        <View style={styles.brandWrap}>
          <Text style={styles.brand}>BID PRO</Text>
          <Text style={styles.brandSub}>Result</Text>
        </View>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ResultCard
          result={result}
          materialCostPerYard={materialCostPerYard}
          costInputRaw={materialCostRaw}
          costUnit={costUnit}
          system={system}
          onSave={onSave}
        />

        {/* Truck Logistics — included with subscription */}
        <TouchableOpacity
          style={styles.logisticsCta}
          activeOpacity={0.85}
          onPress={() => router.push('/logistics' as never)}
        >
          <View style={styles.logisticsCtaLeft}>
            <View style={styles.logisticsCtaIcon}>
              <Ionicons name="bus" size={22} color={brand.orange} />
            </View>
            <View style={styles.logisticsCtaText}>
              <Text style={styles.logisticsCtaTitle}>TRUCK LOGISTICS</Text>
              <Text style={styles.logisticsCtaSub}>Plan loads · efficient or personal</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={22} color={brand.textTertiary} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: brand.bg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: brand.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandWrap: { alignItems: 'center' },
  brand: {
    fontSize: 18,
    fontWeight: '900',
    color: brand.orange,
    letterSpacing: 2,
  },
  brandSub: {
    fontSize: 10,
    fontWeight: '700',
    color: brand.textTertiary,
    letterSpacing: 1.5,
    marginTop: 1,
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  logisticsCta: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: brand.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: brand.border,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  logisticsCtaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logisticsCtaIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: brand.bg,
    borderWidth: 1,
    borderColor: brand.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logisticsCtaText: { flex: 1 },
  logisticsCtaTitle: {
    color: brand.textPrimary,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  logisticsCtaSub: {
    color: brand.textTertiary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  logisticsProBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: brand.orange,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  logisticsProBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 1,
  },
});
