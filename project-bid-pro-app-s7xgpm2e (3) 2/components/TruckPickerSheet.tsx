import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { brand } from '@/constants/theme';
import {
  TRUCK_TYPES,
  PERSONAL_TRUCK_ID,
  MIN_PERSONAL_TONS,
  MAX_PERSONAL_TONS,
  shortTonsToTonnes,
  tonnesToShortTons,
} from '@/lib/calculations';
import { MeasureSystem } from '@/hooks/useWeightUnit';
import { pickerStyles as styles } from './TruckPickerSheet.styles';

// Map truck ID to appropriate MaterialCommunityIcons name
export function truckIconName(id: string): string {
  switch (id) {
    case 'tandem_trailer':
    case 'tandem_utility':
    case 'triaxle_belly':
      return 'truck-trailer';
    case PERSONAL_TRUCK_ID:
      return 'truck-cargo-container';
    default:
      return 'dump-truck';
  }
}

interface TruckPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  selectedTruckId: string;
  onSelect: (id: string) => void;
  system: MeasureSystem;
  /** Current personal-truck capacity in US short tons */
  personalTons: number;
  /** Persist a new personal-truck capacity (US short tons) */
  onChangePersonalTons: (tons: number) => void;
}

export function TruckPickerSheet({
  visible,
  onClose,
  selectedTruckId,
  onSelect,
  system,
  personalTons,
  onChangePersonalTons,
}: TruckPickerSheetProps) {
  const isMetric = system === 'metric';
  const unitWord = isMetric ? 'tonnes' : 'tons';

  // Local draft of the capacity input (shown in the active measure system).
  const displayCap = isMetric ? shortTonsToTonnes(personalTons) : personalTons;
  const [draft, setDraft] = useState<string>(String(+displayCap.toFixed(1)));

  // Keep the draft in sync when the sheet re-opens or the unit/value changes.
  useEffect(() => {
    if (visible) setDraft(String(+displayCap.toFixed(1)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, system, personalTons]);

  const commitDraft = () => {
    const parsed = parseFloat(draft.replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      // Reset to last good value on invalid input.
      setDraft(String(+displayCap.toFixed(1)));
      return;
    }
    // Convert back to US short tons for storage.
    const shortTons = isMetric ? tonnesToShortTons(parsed) : parsed;
    onChangePersonalTons(shortTons);
  };

  const personalActive = selectedTruckId === PERSONAL_TRUCK_ID;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={e => e.stopPropagation()}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>Select Your Truck / Trailer</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={22} color={brand.textSecondary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.sub}>Payload capacity (legal weight limit)</Text>

          <ScrollView
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
          >
            {TRUCK_TYPES.map(item => {
              const active = item.id === selectedTruckId;
              const capacity = isMetric
                ? item.capacityTonnesMetric
                : item.capacityTons;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.option, active && styles.optionActive]}
                  onPress={() => onSelect(item.id)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.optionIcon, active && styles.optionIconActive]}>
                    <MaterialCommunityIcons
                      name={truckIconName(item.id) as any}
                      size={20}
                      color={active ? brand.orange : brand.textTertiary}
                    />
                  </View>
                  <View style={styles.optionContent}>
                    <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>
                      {item.label}
                    </Text>
                    <Text style={styles.optionDesc}>
                      {capacity.toFixed(0)} {unitWord}
                    </Text>
                  </View>
                  <View style={[styles.radio, active && styles.radioActive]}>
                    {active && <View style={styles.radioDot} />}
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Divider */}
            <View style={styles.groupDivider}>
              <View style={styles.groupLine} />
              <Text style={styles.groupLabel}>CUSTOM</Text>
              <View style={styles.groupLine} />
            </View>

            {/* Personal (editable) truck */}
            <TouchableOpacity
              style={[styles.option, personalActive && styles.optionActive]}
              onPress={() => onSelect(PERSONAL_TRUCK_ID)}
              activeOpacity={0.75}
            >
              <View style={[styles.optionIcon, personalActive && styles.optionIconActive]}>
                <MaterialCommunityIcons
                  name={truckIconName(PERSONAL_TRUCK_ID) as any}
                  size={20}
                  color={personalActive ? brand.orange : brand.textTertiary}
                />
              </View>
              <View style={styles.optionContent}>
                <Text style={[styles.optionLabel, personalActive && styles.optionLabelActive]}>
                  Personal Truck
                </Text>
                <Text style={styles.optionDesc}>Set your own capacity</Text>
              </View>
              <View style={[styles.radio, personalActive && styles.radioActive]}>
                {personalActive && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>

            {/* Capacity editor — only when Personal Truck is selected */}
            {personalActive && (
              <View style={styles.capacityEditor}>
                <Text style={styles.capacityLabel}>
                  Payload capacity ({unitWord})
                </Text>
                <View style={styles.capacityInputRow}>
                  <TextInput
                    style={styles.capacityInput}
                    value={draft}
                    onChangeText={setDraft}
                    onEndEditing={commitDraft}
                    onBlur={commitDraft}
                    keyboardType="decimal-pad"
                    returnKeyType="done"
                    onSubmitEditing={commitDraft}
                    placeholder="0"
                    placeholderTextColor={brand.textTertiary}
                    maxLength={5}
                    selectTextOnFocus
                  />
                  <Text style={styles.capacityUnit}>{unitWord}</Text>
                </View>
                <Text style={styles.capacityHint}>
                  Enter your truck's legal payload. Allowed range{' '}
                  {(isMetric ? shortTonsToTonnes(MIN_PERSONAL_TONS) : MIN_PERSONAL_TONS).toFixed(1)}
                  {'\u2013'}
                  {(isMetric ? shortTonsToTonnes(MAX_PERSONAL_TONS) : MAX_PERSONAL_TONS).toFixed(0)}{' '}
                  {unitWord}.
                </Text>
              </View>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
