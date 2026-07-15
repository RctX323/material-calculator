import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { brand } from '@/constants/theme';
import { truckIconName } from './TruckPickerSheet';

interface TruckRowProps {
  truckId: string;
  truckLabel: string;
  capacityTons: number;
  capacityTonnesMetric: number;
  system: 'US' | 'metric';
  count: number;
  onPress?: () => void;
  showChevron?: boolean;
  bordered?: boolean;
}

export function TruckRow({
  truckId,
  truckLabel,
  capacityTons,
  capacityTonnesMetric,
  system,
  count,
  onPress,
  showChevron = false,
  bordered = false,
}: TruckRowProps) {
  const capacity = system === 'metric' ? capacityTonnesMetric : capacityTons;
  const word = system === 'metric' ? 'tonnes' : 'tons';

  const content = (
    <View style={[styles.row, bordered && styles.rowBorder]}>
      <View style={styles.iconBox}>
        <MaterialCommunityIcons
          name={truckIconName(truckId) as any}
          size={18}
          color={brand.orange}
        />
      </View>
      <View style={styles.content}>
        <Text style={styles.name}>{truckLabel}</Text>
        <Text style={styles.sub}>
          {capacity.toFixed(0)} {word}/load
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.value}>
          {count} load{count !== 1 ? 's' : ''}
        </Text>
        {showChevron && (
          <Ionicons name="chevron-down" size={14} color={brand.textTertiary} />
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: brand.border,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(249,115,22,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1 },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: brand.textPrimary,
  },
  sub: {
    fontSize: 12,
    color: brand.textTertiary,
    marginTop: 2,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  value: {
    fontSize: 15,
    fontWeight: '800',
    color: brand.orange,
  },
});
