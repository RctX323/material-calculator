import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { brand } from '@/constants/theme';
import { useMeasureSystem } from '@/hooks/useWeightUnit';
import { TRUCK_TYPES } from '@/lib/calculations';
import { useCustomerInfo } from '@/lib/payments';

interface SettingsRowProps {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  showArrow?: boolean;
}

function SettingsRow({ icon, label, value, onPress, destructive, showArrow = true }: SettingsRowProps) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={styles.rowIcon}>
        <Ionicons
          name={icon as any}
          size={18}
          color={destructive ? brand.error : brand.orange}
        />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, destructive && styles.destructiveText]}>{label}</Text>
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      </View>
      {onPress && showArrow && (
        <Ionicons name="chevron-forward" size={16} color={brand.textTertiary} />
      )}
    </TouchableOpacity>
  );
}

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

function SettingsSection({ title, children }: SettingsSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

export default function SettingsScreen() {
  const { system, setSystem } = useMeasureSystem();
  const { isPro } = useCustomerInfo();
  const [restoring, setRestoring] = useState(false);

  const handleRestore = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not Available', 'Restore purchases is available on iOS and Android only.');
      return;
    }
    setRestoring(true);
    try {
      const Purchases = (await import('react-native-purchases')).default;
      const info = await Purchases.restorePurchases();
      const active = info?.entitlements?.active;
      const restored = !!active && Object.keys(active).length > 0;
      Alert.alert(
        restored ? 'Purchases Restored' : 'Nothing to Restore',
        restored ? 'Your subscription has been restored!' : "We didn't find an active subscription on this Apple ID."
      );
    } catch (e: any) {
      Alert.alert('Restore Failed', e?.message ?? 'Something went wrong.');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSub}>Bid Pro Material Calculator</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Subscription */}
        <SettingsSection title="SUBSCRIPTION">
          <SettingsRow
            icon="diamond"
            label="Subscription"
            value={isPro ? 'Active' : 'Inactive'}
            showArrow={false}
          />
          <SettingsRow
            icon="refresh-outline"
            label={restoring ? 'Restoring...' : 'Restore Purchases'}
            onPress={handleRestore}
          />
          <SettingsRow
            icon="card-outline"
            label="Manage Subscription"
            onPress={() => Linking.openURL('https://apps.apple.com/account/subscriptions')}
          />
        </SettingsSection>

        {/* App */}
        <SettingsSection title="APP">
          <SettingsRow
            icon="information-circle-outline"
            label="Version"
            value="1.0.0"
            showArrow={false}
          />
          <SettingsRow
            icon="phone-portrait-outline"
            label="Platform"
            value={Platform.OS === 'ios' ? 'iOS' : Platform.OS === 'android' ? 'Android' : 'Web'}
            showArrow={false}
          />
        </SettingsSection>

        {/* MEASUREMENT SYSTEM */}
        <SettingsSection title="MEASUREMENT SYSTEM">
          <View style={styles.unitToggleWrap}>
            <Text style={styles.unitToggleDesc}>Weight units shown in results:</Text>
            <View style={styles.unitToggleRow}>
              <TouchableOpacity
                style={[styles.unitBtn, system === 'US' && styles.unitBtnActive]}
                onPress={() => setSystem('US')}
                activeOpacity={0.75}
              >
                <Text style={[styles.unitBtnText, system === 'US' && styles.unitBtnTextActive]}>
                  US (tons)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.unitBtn, system === 'metric' && styles.unitBtnActive]}
                onPress={() => setSystem('metric')}
                activeOpacity={0.75}
              >
                <Text style={[styles.unitBtnText, system === 'metric' && styles.unitBtnTextActive]}>
                  Metric (tonnes)
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.unitToggleHint}>
              {system === 'US' ? 'Short tons (US Imperial)' : 'Metric tonnes (SI)'}
            </Text>
          </View>
        </SettingsSection>

        {/* Material Reference */}
        <SettingsSection title="MATERIAL REFERENCE">
          <SettingsRow
            icon="layers-outline"
            label="Gravel Density"
            value="1.4 tons/CY"
            showArrow={false}
          />
          <SettingsRow
            icon="earth-outline"
            label="Fill Dirt Density"
            value="1.0 tons/CY"
            showArrow={false}
          />
          <SettingsRow
            icon="grid-outline"
            label="Concrete Density"
            value="2.0 tons/CY"
            showArrow={false}
          />
          <SettingsRow
            icon="car-outline"
            label="Asphalt Density"
            value="1.96 tons/CY"
            showArrow={false}
          />
          <SettingsRow
            icon="bag-outline"
            label="80 lb Bag Coverage"
            value="≈ 0.022 CY"
            showArrow={false}
          />
          <SettingsRow
            icon="alert-circle-outline"
            label="Concrete Waste Factor"
            value="+10%"
            showArrow={false}
          />
        </SettingsSection>

        {/* Truck Reference */}
        <SettingsSection title={`TRUCK CAPACITIES (${system === 'metric' ? 'TONNES' : 'TONS'} PAYLOAD)`}>
          {TRUCK_TYPES.map(t => (
            <SettingsRow
              key={t.id}
              icon="construct-outline"
              label={t.label}
              value={`${(system === 'metric' ? t.capacityTonnesMetric : t.capacityTons)} ${system === 'metric' ? 'tonnes' : 'tons'}`}
              showArrow={false}
            />
          ))}
        </SettingsSection>

        {/* Formula Reference */}
        <SettingsSection title="FORMULAS">
          <View style={styles.formulaCard}>
            <Text style={styles.formulaTitle}>Cubic Yards</Text>
            <Text style={styles.formula}>= (L × W × D) ÷ 324</Text>
            <Text style={styles.formulaNote}>where D is in inches</Text>
          </View>
          <View style={styles.formulaCard}>
            <Text style={styles.formulaTitle}>Footing</Text>
            <Text style={styles.formula}>= (P × W × D) ÷ 324</Text>
            <Text style={styles.formulaNote}>P = perimeter in ft, W & D in inches</Text>
          </View>
        </SettingsSection>

        <Text style={styles.footer}>
          © 2024 Bid Pro Material Calculator{'\n'}Built for contractors
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: brand.bg,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: brand.border,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: brand.textPrimary,
  },
  headerSub: {
    fontSize: 12,
    color: brand.textTertiary,
    fontWeight: '500',
    marginTop: 2,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: brand.textTertiary,
    letterSpacing: 1.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: brand.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: brand.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: brand.border,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(249,115,22,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContent: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: brand.textPrimary,
  },
  rowValue: {
    fontSize: 13,
    color: brand.textSecondary,
    marginTop: 2,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
  destructiveText: {
    color: brand.error,
  },
  formulaCard: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: brand.border,
  },
  formulaTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: brand.textSecondary,
    marginBottom: 4,
  },
  formula: {
    fontSize: 16,
    fontWeight: '700',
    color: brand.orange,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    marginBottom: 4,
  },
  formulaNote: {
    fontSize: 11,
    color: brand.textTertiary,
  },
  footer: {
    fontSize: 12,
    color: brand.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 8,
  },
  unitToggleWrap: {
    padding: 16,
  },
  unitToggleDesc: {
    fontSize: 13,
    color: brand.textSecondary,
    marginBottom: 12,
  },
  unitToggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  unitBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.bgElevated,
    borderWidth: 1.5,
    borderColor: brand.border,
  },
  unitBtnActive: {
    backgroundColor: 'rgba(249,115,22,0.12)',
    borderColor: brand.orange,
  },
  unitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: brand.textSecondary,
  },
  unitBtnTextActive: {
    color: brand.orange,
  },
  unitToggleHint: {
    fontSize: 11,
    color: brand.textTertiary,
    marginTop: 10,
    textAlign: 'center',
  },
});