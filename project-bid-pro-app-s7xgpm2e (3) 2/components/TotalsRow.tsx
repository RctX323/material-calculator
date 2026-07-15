import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { brand } from '@/constants/theme';

interface TotalsRowProps {
  totalLabel: string;
  totalValue: string;
  extraLabel: string;
  extraTons: number;          // raw tons (short)
  extraDisplay: string;       // pre-formatted (e.g. "+11.9 tonnes" or "Exact fit")
  extraIsOver: boolean;       // true = orange/white, false = green
  efficiencyPct?: number;     // optional efficiency percentage
}

export function TotalsRow({
  totalLabel,
  totalValue,
  extraLabel,
  extraTons: _extraTons,
  extraDisplay,
  extraIsOver,
  efficiencyPct,
}: TotalsRowProps) {
  return (
    <View>
      <View style={styles.row}>
        <Text style={styles.label}>{totalLabel}</Text>
        <Text style={styles.value}>{totalValue}</Text>
      </View>
      <View style={[styles.row, !efficiencyPct && styles.lastRow]}>
        <Text style={styles.label}>{extraLabel}</Text>
        <Text style={[styles.value, extraIsOver ? styles.valueOver : styles.valueExact]}>
          {extraDisplay}
        </Text>
      </View>
      {efficiencyPct !== undefined && (
        <View style={[styles.row, styles.lastRow]}>
          <Text style={styles.label}>Efficiency</Text>
          <Text style={[styles.value, efficiencyPct >= 95 ? styles.valueExact : styles.value]}>
            {efficiencyPct.toFixed(1)}%
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: brand.border,
  },
  lastRow: {},
  label: {
    fontSize: 13,
    color: brand.textSecondary,
  },
  value: {
    fontSize: 15,
    fontWeight: '800',
    color: brand.orange,
  },
  valueOver: {
    color: brand.textPrimary,
  },
  valueExact: {
    color: brand.success,
  },
});
