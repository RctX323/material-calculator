import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { brand } from '@/constants/theme';
import {
  TRUCK_TYPES,
  TruckType,
  AutoTruckResult,
  bestAutoTruck,
} from '@/lib/calculations';
import { MeasureSystem, convertTons } from '@/hooks/useWeightUnit';
import { TruckPickerSheet } from './TruckPickerSheet';
import { EfficientDetail } from './EfficientDetail';
import { PersonalDetail } from './PersonalDetail';
import { cardStyles as styles } from './TruckLogisticsCard.styles';

interface TruckLogisticsCardProps {
  orderTons: number;
  orderCY?: number;
  unit: 'tons' | 'tonnes' | 'CY';
  system: MeasureSystem;
  autoTruck?: AutoTruckResult | null;
  onSelectTruck?: (truckId: string) => void;
  selectedTruckId?: string;
}

export function TruckLogisticsCard({
  orderTons,
  orderCY,
  unit,
  system,
  autoTruck: initialAutoTruck,
  onSelectTruck,
  selectedTruckId,
}: TruckLogisticsCardProps) {
  const [mode, setMode] = useState<'efficient' | 'personal'>('efficient');
  const [collapsed, setCollapsed] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Compute auto truck if not provided
  const autoTruck: AutoTruckResult | null =
    initialAutoTruck ?? (orderTons > 0 ? bestAutoTruck(orderTons) : null);

  // Resolve the personal truck
  const personalTruck: TruckType =
    TRUCK_TYPES.find(t => t.id === selectedTruckId) ?? TRUCK_TYPES[0];

  // Order banner value
  const word = system === 'metric' ? 'tonnes' : 'tons';
  const orderBannerValue = (() => {
    if (unit === 'CY' && orderCY !== undefined) {
      return `${orderCY.toFixed(1)} CY`;
    }
    const display = unit === 'tonnes' ? convertTons(orderTons, 'metric') : orderTons;
    return `${display.toFixed(1)} ${word}`;
  })();

  return (
    <View style={styles.card}>
      {/* HEADER — collapsible */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => setCollapsed(c => !c)}
        activeOpacity={0.8}
      >
        <View style={styles.headerLeft}>
          <View style={styles.headerIconBox}>
            <MaterialCommunityIcons name="dump-truck" size={18} color={brand.orange} />
          </View>
          <View>
            <Text style={styles.headerTitle}>TRUCK LOGISTICS</Text>
            <Text style={styles.headerSub}>
              {collapsed ? 'Tap to expand' : 'Tap to collapse'}
            </Text>
          </View>
        </View>
        <Ionicons
          name={collapsed ? 'chevron-down' : 'chevron-up'}
          size={20}
          color={brand.textTertiary}
        />
      </TouchableOpacity>

      {!collapsed && (
        <View style={styles.body}>
          {/* ORDER AMOUNT pill */}
          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>ORDER AMOUNT</Text>
            <Text style={styles.orderValue}>{orderBannerValue}</Text>
          </View>

          {/* EFFICIENT / PERSONAL toggle */}
          <View style={styles.toggle}>
            <TouchableOpacity
              style={[styles.toggleBtn, mode === 'efficient' && styles.toggleBtnActive]}
              onPress={() => setMode('efficient')}
              activeOpacity={0.85}
            >
              <Ionicons
                name="flash"
                size={14}
                color={mode === 'efficient' ? '#000' : brand.textTertiary}
              />
              <Text style={[styles.toggleBtnText, mode === 'efficient' && styles.toggleBtnTextActive]}>
                EFFICIENT
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, mode === 'personal' && styles.toggleBtnActive]}
              onPress={() => setMode('personal')}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons
                name="dump-truck"
                size={14}
                color={mode === 'personal' ? '#000' : brand.textTertiary}
              />
              <Text style={[styles.toggleBtnText, mode === 'personal' && styles.toggleBtnTextActive]}>
                PERSONAL
              </Text>
            </TouchableOpacity>
          </View>

          {/* EFFICIENT mode */}
          {mode === 'efficient' && autoTruck && (
            <EfficientDetail autoTruck={autoTruck} system={system} />
          )}

          {/* PERSONAL mode */}
          {mode === 'personal' && (
            <PersonalDetail
              truck={personalTruck}
              orderTons={orderTons}
              system={system}
              onOpenPicker={() => setPickerOpen(true)}
            />
          )}
        </View>
      )}

      <TruckPickerSheet
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        selectedTruckId={personalTruck.id}
        onSelect={id => {
          onSelectTruck?.(id);
          setPickerOpen(false);
        }}
        system={system}
      />
    </View>
  );
}
