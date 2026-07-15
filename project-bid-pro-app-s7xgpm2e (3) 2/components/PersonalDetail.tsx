import React from 'react';
import { StyleSheet, View } from 'react-native';
import { brand } from '@/constants/theme';
import { TruckType } from '@/lib/calculations';
import { MeasureSystem, convertTons } from '@/hooks/useWeightUnit';
import { TruckRow } from './TruckRow';
import { TotalsRow } from './TotalsRow';

interface PersonalDetailProps {
  truck: TruckType;
  orderTons: number;
  system: MeasureSystem;
  onOpenPicker: () => void;
}

export function PersonalDetail({
  truck,
  orderTons,
  system,
  onOpenPicker,
}: PersonalDetailProps) {
  const word = system === 'metric' ? 'tonnes' : 'tons';
  const loads = orderTons > 0 ? Math.ceil(orderTons / truck.capacityTons) : 0;
  const totalTons = loads * truck.capacityTons;
  const extraRaw = Math.max(0, totalTons - orderTons);
  const extraDisplay = extraRaw > 0.05
    ? `+${convertTons(extraRaw, system).toFixed(1)} ${word}`
    : 'Exact fit';

  return (
    <View style={styles.detailBlock}>
      <TruckRow
        truckId={truck.id}
        truckLabel={truck.label}
        capacityTons={truck.capacityTons}
        capacityTonnesMetric={truck.capacityTonnesMetric}
        system={system}
        count={loads}
        onPress={onOpenPicker}
        showChevron
      />
      <TotalsRow
        totalLabel={`Total — ${loads} load${loads !== 1 ? 's' : ''}`}
        totalValue={`${convertTons(totalTons, system).toFixed(1)} ${word}`}
        extraLabel="Extra Material"
        extraTons={extraRaw}
        extraDisplay={extraDisplay}
        extraIsOver={extraRaw > 0.05}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  detailBlock: {
    backgroundColor: brand.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: brand.border,
    overflow: 'hidden',
  },
});
