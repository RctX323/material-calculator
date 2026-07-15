import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { brand } from '@/constants/theme';
import { NumericInput } from '@/components/NumericInput';
import { CalculatorTypeCard } from '@/components/CalculatorTypeCard';
import {
  CalculationType,
  CalculationResult,
  calculateGravel,
  calculateDirt,
  calculateAsphalt,
  calculateConcretePad,
  calculateFooting,
  getTypeLabel,
  COMPACTION_DEFAULTS,
  COMPACTION_MIN,
  COMPACTION_MAX,
  COMPACTION_STEP,
  WASTE_DEFAULT,
  WASTE_MIN,
  WASTE_MAX,
  WASTE_STEP,
  bestAutoTruck,
  AutoTruckResult,
} from '@/lib/calculations';
import { saveCalculation } from '@/lib/db';
import { useMeasureSystem, useCostUnit, getOnboarded, markOnboarded, costPerYardFromUnit } from '@/hooks/useWeightUnit';
import { MeasureSystemPicker } from '@/components/MeasureSystemPicker';
import { useTruckType } from '@/hooks/useTruckType';
import { router } from 'expo-router';
import { useCalcStore } from '@/lib/calcStore';
import { useCustomerInfo } from '@/lib/payments';

const CALC_TYPES: CalculationType[] = ['gravel', 'dirt', 'asphalt', 'concrete_pad', 'footing'];

export default function CalculatorScreen() {
  const queryClient = useQueryClient();
  const { isPro } = useCustomerInfo();
  const { system, setSystem, unit } = useMeasureSystem();
  const { costUnit, setCostUnit } = useCostUnit(system);
  const [showSystemPicker, setShowSystemPicker] = useState(false);

  // First-launch: show system picker if not yet onboarded
  useEffect(() => {
    getOnboarded().then(done => {
      if (!done) setShowSystemPicker(true);
    });
  }, []);

  const handleSystemPickerSelect = async (s: import('@/hooks/useWeightUnit').MeasureSystem) => {
    await setSystem(s);
    await markOnboarded();
    setShowSystemPicker(false);
  };
  const { truck, setTruckId } = useTruckType();

  const [truckMode, setTruckMode] = useState<'auto' | 'manual'>('auto');
  const [activeType, setActiveType] = useState<CalculationType>('gravel');
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [compactionFactor, setCompactionFactor] = useState(COMPACTION_DEFAULTS.gravel);
  const [wasteFactor, setWasteFactor] = useState(WASTE_DEFAULT);
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [depth, setDepth] = useState('4');
  const [perimeter, setPerimeter] = useState('');
  const [footingWidth, setFootingWidth] = useState('16');
  const [footingDepth, setFootingDepth] = useState('8');
  const [materialCost, setMaterialCost] = useState('');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [autoTruck, setAutoTruck] = useState<AutoTruckResult | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const handleTypeSelect = (type: CalculationType) => {
    setActiveType(type);
    setShowTypePicker(false);
    setResult(null);
    setAutoTruck(null);
    setLength(''); setWidth('');
    setDepth(type === 'dirt' ? '6' : '4');
    setPerimeter(''); setFootingWidth('16'); setFootingDepth('8');
    if (type === 'gravel') setCompactionFactor(COMPACTION_DEFAULTS.gravel);
    if (type === 'dirt') setCompactionFactor(COMPACTION_DEFAULTS.dirt);
    if (type === 'asphalt') { setCompactionFactor(COMPACTION_DEFAULTS.asphalt); setDepth('3'); }
    if (type === 'concrete_pad' || type === 'footing') setWasteFactor(WASTE_DEFAULT);
  };

  // Effective cost unit: concrete always CY, haul materials (gravel/dirt/asphalt) use weight unit
  const isConcrete = activeType === 'concrete_pad' || activeType === 'footing';
  const effectiveCostUnit: import('@/hooks/useWeightUnit').WeightUnit = isConcrete ? 'CY' : (system === 'metric' ? 'tonne' : 'ton');

  const handleCalculate = () => {
    Keyboard.dismiss();
    let r: CalculationResult | null = null;

    const truckTons = truck.capacityTons;

    const isConcreteLike = activeType === 'concrete_pad' || activeType === 'footing';

    if (activeType === 'footing') {
      const p = parseFloat(perimeter);
      const fw = parseFloat(footingWidth) || 16;
      const fd = parseFloat(footingDepth) || 8;
      if (!p || p <= 0) { Alert.alert('Missing Value', 'Enter the perimeter.'); return; }
      r = calculateFooting({ perimeter: p, width: fw, depth: fd }, 14, wasteFactor);
    } else {
      const l = parseFloat(length);
      const w = parseFloat(width);
      const d = parseFloat(depth) || 4;
      if (!l || !w || l <= 0 || w <= 0) { Alert.alert('Missing Values', 'Enter length and width.'); return; }
      if (activeType === 'gravel') r = calculateGravel({ length: l, width: w, depth: d }, compactionFactor, truckTons);
      if (activeType === 'dirt') r = calculateDirt({ length: l, width: w, depth: d }, compactionFactor, truckTons);
      if (activeType === 'asphalt') r = calculateAsphalt({ length: l, width: w, depth: d }, truckTons, compactionFactor);
      if (activeType === 'concrete_pad') r = calculateConcretePad({ length: l, width: w, depth: d }, 14, wasteFactor);
    }

    if (!r) return;

    // Auto truck: only for gravel, dirt, asphalt — concrete is hauled by concrete truck
    let resolvedAutoTruck: AutoTruckResult | null = null;
    if (!isConcreteLike && truckMode === 'auto') {
      const orderTons = r.orderTons ?? r.tons ?? 0;
      const best = bestAutoTruck(orderTons);
      resolvedAutoTruck = best;
      r = { ...r, loads: best.loads, truckTons: best.capacityTons };
    }
    setAutoTruck(resolvedAutoTruck);
    setResult(r);

    // Hand the result to the result screen via the store.
    const rawCost = parseFloat(materialCost);
    useCalcStore.getState().setPending({
      result: r,
      autoTruck: resolvedAutoTruck,
      materialCostRaw: rawCost > 0 ? rawCost : undefined,
      costUnit: effectiveCostUnit,
      system,
      truckMode,
      truckId: truck.id,
      onSave: handleSave,
    });

    router.push('/calculating' as never);
  };

  const handleReset = () => {
    setLength(''); setWidth('');
    setDepth(activeType === 'dirt' ? '6' : '4');
    setPerimeter(''); setFootingWidth('16'); setFootingDepth('8');
    setMaterialCost(''); setResult(null); setAutoTruck(null);
    if (activeType === 'gravel') setCompactionFactor(COMPACTION_DEFAULTS.gravel);
    if (activeType === 'dirt') setCompactionFactor(COMPACTION_DEFAULTS.dirt);
    if (activeType === 'concrete_pad' || activeType === 'footing') setWasteFactor(WASTE_DEFAULT);
    if (activeType === 'asphalt') { setCompactionFactor(COMPACTION_DEFAULTS.asphalt); setDepth('3'); }
  };

  const handleSave = useCallback(async () => {
    if (!result) return;
    const inputs = activeType === 'footing'
      ? { perimeter: parseFloat(perimeter), width: parseFloat(footingWidth), depth: parseFloat(footingDepth) }
      : { length: parseFloat(length), width: parseFloat(width), depth: parseFloat(depth) };
    const rawCost = parseFloat(materialCost) || undefined;
    const costPerYard = rawCost
      ? costPerYardFromUnit(rawCost, effectiveCostUnit, result.cubicYards, result.tons)
      : undefined;
    const totalCost = costPerYard ? result.cubicYards * costPerYard : undefined;
    try {
      await saveCalculation({
        type: activeType,
        name: `${getTypeLabel(activeType)} — ${new Date().toLocaleDateString()}`,
        inputs: JSON.stringify(inputs),
        result: result.cubicYards.toFixed(2),
        unit: 'cubic yards',
        materialCost: costPerYard,
        totalCost,
      });
      queryClient.invalidateQueries({ queryKey: ['calculations'] });
      router.push('/(tabs)/history');
    } catch (e) {
      Alert.alert('Error', 'Failed to save. Please try again.');
    }
  }, [result, activeType, perimeter, footingWidth, footingDepth, length, width, depth, materialCost, queryClient, effectiveCostUnit]);

  // Keep the pending result's save handler in sync with the latest memoized version.
  useEffect(() => {
    const current = useCalcStore.getState().pending;
    if (!current) return;
    useCalcStore.setState({
      pending: { ...current, onSave: handleSave },
    });
  }, [handleSave]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Header with US/Metric toggle */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>BID PRO</Text>
            <Text style={styles.headerSub}>Material Calculator</Text>
          </View>
          <View style={styles.headerRight}>
            {/* US / Metric system toggle */}
            <View style={styles.systemToggle}>
              <TouchableOpacity
                style={[styles.sysBtn, system === 'US' && styles.sysBtnActive]}
                onPress={() => setSystem('US')}
                activeOpacity={0.8}
              >
                <Text style={[styles.sysBtnText, system === 'US' && styles.sysBtnTextActive]}>US</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sysBtn, system === 'metric' && styles.sysBtnActive]}
                onPress={() => setSystem('metric')}
                activeOpacity={0.8}
              >
                <Text style={[styles.sysBtnText, system === 'metric' && styles.sysBtnTextActive]}>METRIC</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
              <Ionicons name="refresh" size={18} color={brand.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* First-launch measurement system picker */}
          <MeasureSystemPicker visible={showSystemPicker} onSelect={handleSystemPickerSelect} />

          {/* Truck logistics lives on the dedicated /logistics page (page 2),
              reached from the results screen — not on this calculator screen. */}

          {/* Material Type Selector */}
          <TouchableOpacity style={styles.typePicker} onPress={() => setShowTypePicker(!showTypePicker)} activeOpacity={0.8}>
            <View style={styles.typePickerLeft}>
              <View style={styles.typeIconBox}>
                <Ionicons name={activeType === 'gravel' ? 'layers' : activeType === 'dirt' ? 'earth' : activeType === 'asphalt' ? 'car' : activeType === 'concrete_pad' ? 'grid' : 'construct'} size={20} color={brand.orange} />
              </View>
              <View>
                <Text style={styles.typePickerLabel}>MATERIAL TYPE</Text>
                <Text style={styles.typePickerValue}>{getTypeLabel(activeType)}</Text>
              </View>
            </View>
            <Ionicons name={showTypePicker ? 'chevron-up' : 'chevron-down'} size={20} color={brand.textTertiary} />
          </TouchableOpacity>

          {showTypePicker && (
            <View style={styles.typeList}>
              {CALC_TYPES.map(t => (
                <CalculatorTypeCard key={t} type={t} selected={activeType === t} onPress={() => handleTypeSelect(t)} />
              ))}
            </View>
          )}

          {/* Compaction Factor — gravel, dirt, asphalt */}
          {(activeType === 'gravel' || activeType === 'dirt' || activeType === 'asphalt') && (
            <View style={styles.compactionRow}>
              <View style={styles.compactionLeft}>
                <Text style={styles.compactionLabel}>COMPACTION</Text>
                <Text style={styles.compactionSub}>
                  {((compactionFactor - 1) * 100).toFixed(0)}% allowance
                  {compactionFactor === (activeType === 'gravel' ? COMPACTION_DEFAULTS.gravel : activeType === 'asphalt' ? COMPACTION_DEFAULTS.asphalt : COMPACTION_DEFAULTS.dirt)
                    ? '  (industry standard)' : '  (custom)'}
                </Text>
              </View>
              <View style={styles.compactionStepper}>
                <TouchableOpacity
                  style={[styles.stepBtn, compactionFactor <= COMPACTION_MIN && styles.stepBtnDisabled]}
                  onPress={() => setCompactionFactor(f => Math.max(COMPACTION_MIN, Math.round((f - COMPACTION_STEP) * 100) / 100))}
                  activeOpacity={0.7}
                  disabled={compactionFactor <= COMPACTION_MIN}
                >
                  <Ionicons name="remove" size={18} color={compactionFactor <= COMPACTION_MIN ? brand.textTertiary : brand.orange} />
                </TouchableOpacity>
                <Text style={styles.stepValue}>{((compactionFactor - 1) * 100).toFixed(0)}%</Text>
                <TouchableOpacity
                  style={[styles.stepBtn, compactionFactor >= COMPACTION_MAX && styles.stepBtnDisabled]}
                  onPress={() => setCompactionFactor(f => Math.min(COMPACTION_MAX, Math.round((f + COMPACTION_STEP) * 100) / 100))}
                  activeOpacity={0.7}
                  disabled={compactionFactor >= COMPACTION_MAX}
                >
                  <Ionicons name="add" size={18} color={compactionFactor >= COMPACTION_MAX ? brand.textTertiary : brand.orange} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Waste / Spill Factor — concrete & footing only */}
          {(activeType === 'concrete_pad' || activeType === 'footing') && (
            <View style={styles.compactionRow}>
              <View style={styles.compactionLeft}>
                <Text style={styles.compactionLabel}>WASTE / SPILL FACTOR</Text>
                <Text style={styles.compactionSub}>
                  {((wasteFactor - 1) * 100).toFixed(0)}% allowance
                  {wasteFactor === WASTE_DEFAULT ? '  (industry standard)' : '  (custom)'}
                </Text>
              </View>
              <View style={styles.compactionStepper}>
                <TouchableOpacity
                  style={[styles.stepBtn, wasteFactor <= WASTE_MIN && styles.stepBtnDisabled]}
                  onPress={() => setWasteFactor(f => Math.max(WASTE_MIN, Math.round((f - WASTE_STEP) * 100) / 100))}
                  activeOpacity={0.7}
                  disabled={wasteFactor <= WASTE_MIN}
                >
                  <Ionicons name="remove" size={18} color={wasteFactor <= WASTE_MIN ? brand.textTertiary : brand.orange} />
                </TouchableOpacity>
                <Text style={styles.stepValue}>{((wasteFactor - 1) * 100).toFixed(0)}%</Text>
                <TouchableOpacity
                  style={[styles.stepBtn, wasteFactor >= WASTE_MAX && styles.stepBtnDisabled]}
                  onPress={() => setWasteFactor(f => Math.min(WASTE_MAX, Math.round((f + WASTE_STEP) * 100) / 100))}
                  activeOpacity={0.7}
                  disabled={wasteFactor >= WASTE_MAX}
                >
                  <Ionicons name="add" size={18} color={wasteFactor >= WASTE_MAX ? brand.textTertiary : brand.orange} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Dimensions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>DIMENSIONS</Text>
            {activeType === 'footing' ? (
              <View style={styles.dimRow}>
                <View style={styles.dimCol}>
                  <Text style={styles.dimLabel}>PERIMETER</Text>
                  <View style={styles.dimInputRow}>
                    <TextInput
                      style={[styles.dimInput, Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}]}
                      value={perimeter} onChangeText={setPerimeter}
                      placeholder="0" placeholderTextColor={brand.textTertiary}
                      keyboardType="decimal-pad" returnKeyType="done" selectTextOnFocus
                    />
                    <Text style={styles.dimUnit}>ft</Text>
                  </View>
                </View>
                <View style={styles.dimCol}>
                  <Text style={styles.dimLabel}>WIDTH</Text>
                  <View style={styles.dimInputRow}>
                    <TextInput
                      style={[styles.dimInput, Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}]}
                      value={footingWidth} onChangeText={setFootingWidth}
                      placeholder="16" placeholderTextColor={brand.textTertiary}
                      keyboardType="decimal-pad" returnKeyType="done" selectTextOnFocus
                    />
                    <Text style={styles.dimUnit}>in</Text>
                  </View>
                </View>
                <View style={styles.dimCol}>
                  <Text style={styles.dimLabel}>DEPTH</Text>
                  <View style={styles.dimInputRow}>
                    <TextInput
                      style={[styles.dimInput, Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}]}
                      value={footingDepth} onChangeText={setFootingDepth}
                      placeholder="8" placeholderTextColor={brand.textTertiary}
                      keyboardType="decimal-pad" returnKeyType="done" selectTextOnFocus
                    />
                    <Text style={styles.dimUnit}>in</Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.dimRow}>
                <View style={styles.dimCol}>
                  <Text style={styles.dimLabel}>LENGTH</Text>
                  <View style={styles.dimInputRow}>
                    <TextInput
                      style={[styles.dimInput, Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}]}
                      value={length} onChangeText={setLength}
                      placeholder="0" placeholderTextColor={brand.textTertiary}
                      keyboardType="decimal-pad" returnKeyType="done" selectTextOnFocus
                    />
                    <Text style={styles.dimUnit}>ft</Text>
                  </View>
                </View>
                <View style={styles.dimCol}>
                  <Text style={styles.dimLabel}>WIDTH</Text>
                  <View style={styles.dimInputRow}>
                    <TextInput
                      style={[styles.dimInput, Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}]}
                      value={width} onChangeText={setWidth}
                      placeholder="0" placeholderTextColor={brand.textTertiary}
                      keyboardType="decimal-pad" returnKeyType="done" selectTextOnFocus
                    />
                    <Text style={styles.dimUnit}>ft</Text>
                  </View>
                </View>
                <View style={styles.dimCol}>
                  <Text style={styles.dimLabel}>{activeType === 'concrete_pad' ? 'THICKNESS' : 'DEPTH'}</Text>
                  <View style={styles.dimInputRow}>
                    <TextInput
                      style={[styles.dimInput, Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}]}
                      value={depth} onChangeText={setDepth}
                      placeholder="4" placeholderTextColor={brand.textTertiary}
                      keyboardType="decimal-pad" returnKeyType="done" selectTextOnFocus
                    />
                    <Text style={styles.dimUnit}>in</Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Material Cost */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>MATERIAL COST (optional)</Text>
            {/* Cost unit selector */}
            {isConcrete ? (
              // Concrete/footing: always CY, no choice
              <View style={styles.costUnitRow}>
                <Text style={styles.costUnitLabel}>Price per:</Text>
                <View style={[styles.costUnitBtn, styles.costUnitBtnActive]}>
                  <Text style={[styles.costUnitBtnText, styles.costUnitBtnTextActive]}>CY</Text>
                </View>
              </View>
            ) : activeType === 'asphalt' ? (
              // Asphalt: always per ton/tonne (no CY option), no choice
              <View style={styles.costUnitRow}>
                <Text style={styles.costUnitLabel}>Price per:</Text>
                <View style={[styles.costUnitBtn, styles.costUnitBtnActive]}>
                  <Text style={[styles.costUnitBtnText, styles.costUnitBtnTextActive]}>{unit}</Text>
                </View>
              </View>
            ) : (
              // Gravel/dirt: weight unit (from system) OR CY
              <View style={styles.costUnitRow}>
                <Text style={styles.costUnitLabel}>Price per:</Text>
                <TouchableOpacity
                  style={[styles.costUnitBtn, costUnit === unit && styles.costUnitBtnActive]}
                  onPress={() => setCostUnit(unit)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.costUnitBtnText, costUnit === unit && styles.costUnitBtnTextActive]}>
                    {unit === 'tonne' ? 'tonne' : 'ton'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.costUnitBtn, costUnit === 'CY' && styles.costUnitBtnActive]}
                  onPress={() => setCostUnit('CY')}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.costUnitBtnText, costUnit === 'CY' && styles.costUnitBtnTextActive]}>CY</Text>
                </TouchableOpacity>
              </View>
            )}
            
            <NumericInput
              label={`Cost per ${effectiveCostUnit}`}
              value={materialCost}
              onChangeText={setMaterialCost}
              unit={`$ / ${effectiveCostUnit}`}
            />
          </View>

          {/* Pro Banner — only show if not Pro */}
          {!isPro && (
            <TouchableOpacity
              style={styles.proBanner}
              activeOpacity={0.85}
              onPress={() => router.push('/paywall' as never)}
            >
              <View style={styles.proBannerLeft}>
                <Ionicons name="diamond" size={20} color="#000" />
                <View>
                  <Text style={styles.proBannerTitle}>BID PRO UNLIMITED</Text>
                  <Text style={styles.proBannerSub}>Truck logistics, unlimited saves & more</Text>
                </View>
              </View>
              <View style={styles.proBannerCta}>
                <Text style={styles.proBannerCtaText}>UPGRADE</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Calculate */}
          <TouchableOpacity style={styles.calcBtn} onPress={handleCalculate} activeOpacity={0.85}>
            <Ionicons name="calculator" size={20} color="#000" />
            <Text style={styles.calcBtnText}>CALCULATE</Text>
          </TouchableOpacity>

          {/* Results render on /result screen — no inline result on this page */}

          <View style={{ height: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: brand.bg },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: brand.border,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: brand.orange, letterSpacing: 1 },
  headerSub: { fontSize: 12, color: brand.textTertiary, fontWeight: '500', letterSpacing: 0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  systemToggle: {
    flexDirection: 'row',
    backgroundColor: brand.bgCard,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: brand.border,
    overflow: 'hidden',
  },
  sysBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  sysBtnActive: { backgroundColor: brand.orange },
  sysBtnText: { fontSize: 11, fontWeight: '800', color: brand.textTertiary, letterSpacing: 0.5 },
  sysBtnTextActive: { color: '#000' },
  resetBtn: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: brand.bgCard,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: brand.border,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 20 },
  typePicker: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: brand.bgCard, borderRadius: 14, padding: 16,
    borderWidth: 1.5, borderColor: brand.orange, marginBottom: 12,
  },
  typePickerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  typeIconBox: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  typePickerLabel: { fontSize: 10, fontWeight: '700', color: brand.textTertiary, letterSpacing: 1 },
  typePickerValue: { fontSize: 17, fontWeight: '700', color: brand.textPrimary },
  typeList: { marginBottom: 12 },
  compactionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: brand.bgCard, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: brand.border, marginBottom: 12,
  },
  compactionLeft: { flex: 1 },
  compactionLabel: { fontSize: 10, fontWeight: '700', color: brand.textTertiary, letterSpacing: 1 },
  compactionSub: { fontSize: 12, color: brand.textSecondary, marginTop: 2 },
  compactionStepper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepBtn: {
    width: 34, height: 34, borderRadius: 8,
    backgroundColor: brand.bgElevated, borderWidth: 1, borderColor: brand.border,
    alignItems: 'center', justifyContent: 'center',
  },
  stepBtnDisabled: { opacity: 0.4 },
  stepValue: { fontSize: 15, fontWeight: '700', color: brand.orange, minWidth: 36, textAlign: 'center' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: brand.textTertiary, letterSpacing: 1.5, marginBottom: 12 },
  calcBtn: {
    backgroundColor: brand.orange, borderRadius: 14, height: 56,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    marginBottom: 20,
    shadowColor: brand.orange, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  calcBtnText: { fontSize: 17, fontWeight: '800', color: '#000', letterSpacing: 1 },
  resultSection: { marginBottom: 8 },
  costUnitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  costUnitLabel: {
    fontSize: 12,
    color: brand.textTertiary,
    fontWeight: '600',
  },
  costUnitBtn: {
    paddingHorizontal: 10,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.bgCard,
    borderWidth: 1.5,
    borderColor: brand.border,
  },
  costUnitBtnActive: {
    backgroundColor: 'rgba(249,115,22,0.14)',
    borderColor: brand.orange,
  },
  costUnitBtnText: { fontSize: 12, fontWeight: '700', color: brand.textSecondary },
  costUnitBtnTextActive: { color: brand.orange },
  dimRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  dimCol: { flex: 1 },
  dimLabel: { fontSize: 10, fontWeight: '700', color: brand.textTertiary, letterSpacing: 0.8, marginBottom: 4, textAlign: 'center' },
  dimInputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: brand.bgInput, borderRadius: 10, borderWidth: 1, borderColor: brand.border,
    paddingHorizontal: 6, height: 44, justifyContent: 'center',
  },
  dimInput: { flex: 1, fontSize: 16, fontWeight: '700', color: brand.textPrimary, textAlign: 'center' },
  dimUnit: { fontSize: 11, color: brand.textTertiary, fontWeight: '600' },
  proBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: brand.orange,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  proBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  proBannerTitle: { fontSize: 14, fontWeight: '800', color: '#000' },
  proBannerSub: { fontSize: 11, color: 'rgba(0,0,0,0.6)', marginTop: 1 },
  proBannerCta: {
    backgroundColor: '#000',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  proBannerCtaText: { fontSize: 12, fontWeight: '900', color: brand.orange, letterSpacing: 1 },
});
