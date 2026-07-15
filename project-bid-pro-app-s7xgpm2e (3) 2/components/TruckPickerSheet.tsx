import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { brand } from '@/constants/theme';
import { TRUCK_TYPES } from '@/lib/calculations';
import { MeasureSystem } from '@/hooks/useWeightUnit';
import { pickerStyles as styles } from './TruckPickerSheet.styles';

// Map truck ID to appropriate MaterialCommunityIcons name
export function truckIconName(id: string): string {
  switch (id) {
    case 'tandem_trailer':
    case 'tandem_utility':
    case 'triaxle_belly':
      return 'truck-trailer';
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
}

export function TruckPickerSheet({
  visible,
  onClose,
  selectedTruckId,
  onSelect,
  system,
}: TruckPickerSheetProps) {
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
          <FlatList
            data={TRUCK_TYPES}
            keyExtractor={item => item.id}
            renderItem={({ item }) => {
              const active = item.id === selectedTruckId;
              const capacity = system === 'metric'
                ? item.capacityTonnesMetric
                : item.capacityTons;
              return (
                <TouchableOpacity
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
                      {capacity.toFixed(0)} {system === 'metric' ? 'tonnes' : 'tons'}
                    </Text>
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
  );
}
