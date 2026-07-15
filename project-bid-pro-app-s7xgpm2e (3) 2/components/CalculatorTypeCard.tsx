import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { brand } from '@/constants/theme';
import { CalculationType, getTypeLabel } from '@/lib/calculations';

const TYPE_ICONS: Record<CalculationType, string> = {
  gravel: 'layers',
  dirt: 'earth',
  asphalt: 'car',
  concrete_pad: 'grid',
  footing: 'construct',
};

const TYPE_DESC: Record<CalculationType, string> = {
  gravel: 'Crushed stone, pea gravel, base material',
  dirt: 'Fill dirt, topsoil, backfill material',
  asphalt: 'Hot mix asphalt, driveways, roads',
  concrete_pad: 'Slabs, driveways, patios, floors',
  footing: 'Foundation footings, continuous walls',
};

interface Props {
  type: CalculationType;
  selected: boolean;
  onPress: () => void;
}

export function CalculatorTypeCard({ type, selected, onPress }: Props) {
  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.cardSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconBox, selected && styles.iconBoxSelected]}>
        <Ionicons
          name={TYPE_ICONS[type] as any}
          size={22}
          color={selected ? brand.bg : brand.textSecondary}
        />
      </View>
      <View style={styles.textBox}>
        <Text style={[styles.label, selected && styles.labelSelected]}>
          {getTypeLabel(type)}
        </Text>
        <Text style={styles.desc} numberOfLines={1}>
          {TYPE_DESC[type]}
        </Text>
      </View>
      {selected && (
        <Ionicons name="checkmark-circle" size={20} color={brand.orange} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: brand.bgCard,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: brand.border,
    marginBottom: 8,
  },
  cardSelected: {
    borderColor: brand.orange,
    backgroundColor: brand.bgElevated,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: brand.bgInput,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxSelected: {
    backgroundColor: brand.orange,
  },
  textBox: {
    flex: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: brand.textSecondary,
    marginBottom: 2,
  },
  labelSelected: {
    color: brand.textPrimary,
  },
  desc: {
    fontSize: 12,
    color: brand.textTertiary,
  },
});
