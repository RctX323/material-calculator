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
import { TruckLogisticsCard } from '@/components/TruckLogisticsCard';
import { useCalcStore } from '@/lib/calcStore';
import { useTruckType } from '@/hooks/useTruckType';

/**
 * Page 2 of the result flow.
 * Dedicated Truck Logistics page — user comes here after seeing the
 * order amount to plan loads (efficient or personal truck).
 * Back button returns to /result.
 */
export default function LogisticsScreen() {
  const pending = useCalcStore(s => s.pending);
  const { truck, setTruckId, personalTons, setPersonalTons } = useTruckType();

  // If user lands here without a pending result (deep link, refresh),
  // bounce them back to the calculator.
  useEffect(() => {
    if (!pending) {
      const t = setTimeout(() => {
        router.replace('/(tabs)');
      }, 0);
      return () => clearTimeout(t);
    }
  }, [pending]);

  if (!pending) {
    return <View style={styles.container} />;
  }

  const { result, autoTruck, system } = pending;

  // Same unit logic as the previous result screen:
  // - Gravel/dirt/asphalt → tons (or tonnes for metric)
  // - Concrete/footing → CY
  const hasTons = result.tons !== undefined;
  const orderTons = result.orderTons ?? 0;
  const orderCY = result.orderCY;
  const orderUnit: 'tons' | 'tonnes' | 'CY' =
    hasTons ? (system === 'metric' ? 'tonnes' : 'tons') : 'CY';

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
          <Text style={styles.brandSub}>Truck Logistics</Text>
        </View>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TruckLogisticsCard
          orderTons={orderTons}
          orderCY={orderCY}
          unit={orderUnit}
          system={system}
          autoTruck={autoTruck}
          onSelectTruck={setTruckId}
          selectedTruckId={truck.id}
          selectedTruck={truck}
          personalTons={personalTons}
          onChangePersonalTons={setPersonalTons}
        />
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
});
