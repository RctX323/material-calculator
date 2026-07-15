import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { brand } from '@/constants/theme';
import { TRUCK_TYPES, TruckType } from '@/lib/calculations';
import { MeasureSystem } from '@/hooks/useWeightUnit';

// Map truck ID to appropriate icon
function truckIcon(id: string): string {
  switch (id) {
    case 'tandem_trailer':
    case 'tandem_utility':
    case 'triaxle_belly':
      return 'truck-trailer';
    default:
      return 'dump-truck';
  }
}


interface TruckSelectorProps {
  truck: TruckType;
  onSelect: (id: string) => void;
  system?: MeasureSystem;
  mode: 'auto' | 'manual';
  onModeChange: (mode: 'auto' | 'manual') => void;
  // Efficient order summary — passed in from parent after calculation
  autoLabel?: string;   // e.g. "7× Tri-Axle Belly Dump"
  autoLoads?: number;
  autoEff?: number;
}

export function TruckSelector({
  truck,
  onSelect,
  system = 'US',
  mode,
  onModeChange,
  autoLabel,
  autoLoads,
  autoEff,
}: TruckSelectorProps) {
  const [open, setOpen] = useState(false);

  const weightUnit = system === 'metric' ? 'T' : 't';

  const capacityLabel = (truck: TruckType) => {
    const tons = system === 'metric' ? truck.capacityTonnesMetric : truck.capacityTons;
    return `${tons.toFixed(0)} ${weightUnit}`;
  };

  return (
    <>
      {/* EFFICIENT ORDER / PERSONAL TRUCK toggle */}
      <View style={styles.modeRow}>
        <Text style={styles.modeLabel}>LOGISTICS</Text>
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'auto' && styles.modeBtnActive]}
            onPress={() => onModeChange('auto')}
            activeOpacity={0.8}
          >
            <Ionicons name="flash" size={13} color={mode === 'auto' ? '#000' : brand.textTertiary} />
            <Text style={[styles.modeBtnText, mode === 'auto' && styles.modeBtnTextActive]}>EFFICIENT</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'manual' && styles.modeBtnActive]}
            onPress={() => onModeChange('manual')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="dump-truck" size={13} color={mode === 'manual' ? '#000' : brand.textTertiary} />
            <Text style={[styles.modeBtnText, mode === 'manual' && styles.modeBtnTextActive]}>PERSONAL</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* EFFICIENT ORDER mode — show fleet summary or prompt */}
      {mode === 'auto' && (
        <View style={styles.autoCard}>
          <View style={styles.autoIcon}>
            <Ionicons name="flash" size={20} color={brand.orange} />
          </View>
          <View style={styles.autoContent}>
            <Text style={styles.autoLabel}>EFFICIENT ORDER</Text>
            {autoLabel ? (
              <Text style={styles.autoValue}>
                {autoLabel} · {autoLoads} load{autoLoads !== 1 ? 's' : ''}
              </Text>
            ) : (
              <Text style={styles.autoHint}>Calculate to see the most efficient haul combination</Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={16} color={brand.textTertiary} />
        </View>
      )}

      {/* PERSONAL TRUCK mode — truck picker trigger */}
      {mode === 'manual' && (
        <TouchableOpacity
          style={styles.trigger}
          onPress={() => setOpen(true)}
          activeOpacity={0.8}
        >
          <View style={styles.triggerLeft}>
            <View style={styles.truckIcon}>
              <MaterialCommunityIcons name={truckIcon(truck.id) as any} size={18} color={brand.orange} />
            </View>
            <View>
              <Text style={styles.triggerLabel}>YOUR TRUCK / TRAILER</Text>
              <Text style={styles.triggerValue}>{truck.label}</Text>
            </View>
          </View>
          <View style={styles.triggerRight}>
            <Text style={styles.triggerCY}>{capacityLabel(truck)}</Text>
            <Ionicons name="chevron-down" size={16} color={brand.textTertiary} />
          </View>
        </TouchableOpacity>
      )}

      {/* Truck picker modal */}
      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={e => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Select Your Truck / Trailer</Text>
              <TouchableOpacity onPress={() => setOpen(false)} hitSlop={12}>
                <Ionicons name="close" size={22} color={brand.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.sheetSub}>Payload capacity (legal weight limit)</Text>
            <FlatList
              data={TRUCK_TYPES}
              keyExtractor={item => item.id}
              renderItem={({ item }) => {
                const active = item.id === truck.id;
                return (
                  <TouchableOpacity
                    style={[styles.option, active && styles.optionActive]}
                    onPress={() => { onSelect(item.id); setOpen(false); }}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.optionIcon, active && styles.optionIconActive]}>
                      <MaterialCommunityIcons name={truckIcon(item.id) as any} size={20} color={active ? brand.orange : brand.textTertiary} />
                    </View>
                    <View style={styles.optionContent}>
                      <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>
                        {item.label}
                      </Text>
                      <Text style={styles.optionDesc}>{capacityLabel(item)}</Text>
                    </View>
                    <View style={[styles.radio, active && styles.radioActive]}>
                      {active && <View style={styles.radioDot} />}
                    </View>
                  </TouchableOpacity>
                );
              }}
              ItemSeparatorComponent={() => <View style={styles.sep} />}
              contentContainerStyle={styles.listContent}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // Mode toggle row
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: brand.textPrimary,
    letterSpacing: 1.2,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: brand.bgCard,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: brand.border,
    overflow: 'hidden',
  },
  modeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  modeBtnActive: {
    backgroundColor: brand.orange,
  },
  modeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: brand.textTertiary,
  },
  modeBtnTextActive: {
    color: '#000',
  },
  // Auto card
  autoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: brand.bgCard,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: brand.border,
    marginBottom: 12,
  },
  autoIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(249,115,22,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  autoContent: { flex: 1 },
  autoLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: brand.orange,
    letterSpacing: 1,
    marginBottom: 3,
  },
  autoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: brand.textPrimary,
  },
  autoHint: {
    fontSize: 12,
    color: brand.textTertiary,
    fontStyle: 'italic',
  },
  // Manual trigger
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: brand.bgCard,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: brand.border,
    marginBottom: 12,
  },
  triggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  truckIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(249,115,22,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: brand.textTertiary,
    letterSpacing: 1,
  },
  triggerValue: {
    fontSize: 14,
    fontWeight: '700',
    color: brand.textPrimary,
    marginTop: 1,
  },
  triggerRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  triggerCY: {
    fontSize: 12,
    fontWeight: '700',
    color: brand.orange,
  },
  // Modal
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: brand.bgCard,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    maxHeight: '80%',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: brand.border,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: brand.border,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: brand.textPrimary,
  },
  sheetSub: {
    fontSize: 11,
    color: brand.textTertiary,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  listContent: { padding: 16 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: brand.bgElevated,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: brand.border,
  },
  optionActive: {
    borderColor: brand.orange,
    backgroundColor: 'rgba(249,115,22,0.08)',
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: brand.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconActive: { backgroundColor: 'rgba(249,115,22,0.15)' },
  optionContent: { flex: 1 },
  optionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: brand.textPrimary,
  },
  optionLabelActive: { color: brand.orange },
  optionDesc: {
    fontSize: 12,
    color: brand.textTertiary,
    marginTop: 2,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: brand.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: brand.orange },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: brand.orange,
  },
  sep: { height: 8 },
});
