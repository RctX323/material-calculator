import React from 'react';
import { StyleSheet, View } from 'react-native';
import { brand } from '@/constants/theme';
import { AutoTruckResult } from '@/lib/calculations';
import { MeasureSystem, convertTons } from '@/hooks/useWeightUnit';
import { TruckRow } from './TruckRow';
import { TotalsRow } from './TotalsRow';

interface EfficientDetailProps {
  autoTruck: AutoTruckResult;
  system: MeasureSystem;
}

export function EfficientDetail({ autoTruck, system }: EfficientDetailProps) {
  const word = system === 'metric' ? 'tonnes' : 'tons';
  return (
    <View style={styles.detailBlock}>
      {autoTruck.fleet.map((entry, idx) => (
        <TruckRow
          key={entry.truckId}
          truckId={entry.truckId}
          truckLabel={entry.truckLabel}
          capacityTons={entry.capacityTons}
          capacityTonnesMetric={entry.capacityTons * 0.907185}
          system={system}
          count={entry.count}
          bordered={idx < autoTruck.fleet.length - 1}
        />
      ))}
      <TotalsRow
        totalLabel={`Total — ${autoTruck.totalLoads} load${autoTruck.totalLoads !== 1 ? 's' : ''}`}
        totalValue={`${convertTons(autoTruck.totalTons, system).toFixed(1)} ${word}`}
        extraLabel="Extra Material"
        extraTons={autoTruck.extraTons}
        extraDisplay={
          autoTruck.extraTons > 0.05
            ? `+${convertTons(autoTruck.extraTons, system).toFixed(1)} ${word}`
            : 'Exact fit'
        }
        extraIsOver={autoTruck.extraTons > 0.05}
        efficiencyPct={autoTruck.efficiencyPct}
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
