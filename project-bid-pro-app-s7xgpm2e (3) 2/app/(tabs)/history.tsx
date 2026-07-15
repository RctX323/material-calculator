import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { brand } from '@/constants/theme';
import { getCalculations, deleteCalculation, CalculationRecord } from '@/lib/db';
import { getTypeLabel, getTypeIcon, CalculationType } from '@/lib/calculations';

// Density (tons per CY) — mirrors calculations.ts DENSITY constants
const DENSITY: Record<string, number> = {
  gravel: 1.4,
  dirt: 1.0,
};

function formatResult(type: string, cy: number): string {
  const density = DENSITY[type];
  if (density) {
    const tons = cy * density;
    return `${tons.toFixed(1)} tons`;
  }
  return `${cy.toFixed(2)} CY`;
}

const TYPE_COLORS: Record<string, string> = {
  gravel: '#F59E0B',
  dirt: '#A16207',
  concrete_pad: '#6B7280',
  footing: '#3B82F6',
};

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

function parseInputsForDisplay(inputs: string, type: string): string {
  try {
    const obj = JSON.parse(inputs);
    if (type === 'footing') {
      return `${obj.perimeter}' perim × ${obj.width}"w × ${obj.depth}"d`;
    }
    return `${obj.length}' × ${obj.width}' × ${obj.depth}"`;
  } catch {
    return '';
  }
}

interface HistoryItemProps {
  item: CalculationRecord;
  onDelete: (id: string) => void;
}

function HistoryItem({ item, onDelete }: HistoryItemProps) {
  // Job-type records: { items: JobItem[] } payload with pre-formatted result string.
  // Render a different layout — none of the per-type helpers (parseInputsForDisplay,
  // formatResult, getTypeIcon, getTypeLabel) understand a job payload, so we'd
  // get NaN/undefined otherwise.
  if (item.type === 'job') {
    const jobColor = brand.orange;
    const itemCount = (() => {
      try {
        const obj = JSON.parse(item.inputs);
        return Array.isArray(obj?.items) ? obj.items.length : 0;
      } catch {
        return 0;
      }
    })();
    return (
      <View style={styles.item}>
        <View style={[styles.itemIcon, { backgroundColor: `${jobColor}22` }]}>
          <Ionicons name="briefcase-outline" size={20} color={jobColor} />
        </View>
        <View style={styles.itemContent}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.itemDate}>{formatDate(item.createdAt)}</Text>
          </View>
          <Text style={styles.itemDims}>
            {itemCount > 0 ? `${itemCount} material${itemCount !== 1 ? 's' : ''}` : 'Job'}
          </Text>
          <View style={styles.itemFooter}>
            <View style={[styles.itemTag, { backgroundColor: `${jobColor}22` }]}>
              <Text style={[styles.itemTagText, { color: jobColor }]}>JOB</Text>
            </View>
            <Text style={styles.itemResult}>{item.result}</Text>
            {item.totalCost ? (
              <Text style={styles.itemCost}>
                ${item.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            ) : null}
          </View>
        </View>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => onDelete(item.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Delete saved job"
        >
          <Ionicons name="trash-outline" size={18} color={brand.textTertiary} />
        </TouchableOpacity>
      </View>
    );
  }

  const typeColor = TYPE_COLORS[item.type] || brand.orange;
  const typeLabel = getTypeLabel(item.type as CalculationType);
  const dimStr = parseInputsForDisplay(item.inputs, item.type);

  return (
    <View style={styles.item}>
      <View style={[styles.itemIcon, { backgroundColor: `${typeColor}22` }]}>
        <Ionicons
          name={getTypeIcon(item.type as CalculationType) as any}
          size={20}
          color={typeColor}
        />
      </View>
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.itemDate}>{formatDate(item.createdAt)}</Text>
        </View>
        <Text style={styles.itemDims}>{dimStr}</Text>
        <View style={styles.itemFooter}>
          <View style={[styles.itemTag, { backgroundColor: `${typeColor}22` }]}>
            <Text style={[styles.itemTagText, { color: typeColor }]}>{typeLabel}</Text>
          </View>
          <Text style={styles.itemResult}>
            {formatResult(item.type, parseFloat(item.result))}
          </Text>
          {item.totalCost ? (
            <Text style={styles.itemCost}>
              ${item.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          ) : null}
        </View>
      </View>
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => onDelete(item.id)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityRole="button"
        accessibilityLabel="Delete calculation"
      >
        <Ionicons name="trash-outline" size={18} color={brand.textTertiary} />
      </TouchableOpacity>
    </View>
  );
}

export default function HistoryScreen() {
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();

  const { data: calculations = [], isLoading, refetch } = useQuery({
    queryKey: ['calculations'],
    queryFn: getCalculations,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCalculation,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['calculations'] });
      const prev = queryClient.getQueryData<CalculationRecord[]>(['calculations']);
      queryClient.setQueryData<CalculationRecord[]>(['calculations'], (old) =>
        (old || []).filter(c => c.id !== id)
      );
      return { prev };
    },
    onError: (_err, _id, context) => {
      if (context?.prev) {
        queryClient.setQueryData(['calculations'], context.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['calculations'] });
    },
  });

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Saved Jobs</Text>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator color={brand.orange} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Saved Jobs</Text>
          <Text style={styles.headerSub}>
            {calculations.length} saved calculation{calculations.length !== 1 ? 's' : ''}
          </Text>
        </View>
        {calculations.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{calculations.length}</Text>
          </View>
        )}
      </View>

      {calculations.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="time-outline" size={48} color={brand.textTertiary} />
          </View>
          <Text style={styles.emptyTitle}>No Calculations Yet</Text>
          <Text style={styles.emptyDesc}>
            Run a calculation and tap "Save" to build your history
          </Text>
        </View>
      ) : (
        <FlatList
          data={calculations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <HistoryItem item={item} onDelete={handleDelete} />
          )}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 60 + 16 }]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor={brand.orange}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: brand.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: brand.border,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: brand.textPrimary,
  },
  headerSub: {
    fontSize: 12,
    color: brand.textTertiary,
    fontWeight: '500',
    marginTop: 2,
  },
  countBadge: {
    backgroundColor: brand.orange,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    padding: 16,
  },
  separator: {
    height: 10,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: brand.bgCard,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: brand.border,
  },
  itemIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  itemContent: {
    flex: 1,
    gap: 4,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: brand.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  itemDate: {
    fontSize: 11,
    color: brand.textTertiary,
    fontWeight: '500',
  },
  itemDims: {
    fontSize: 12,
    color: brand.textSecondary,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  itemTag: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  itemTagText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  itemResult: {
    fontSize: 14,
    fontWeight: '700',
    color: brand.orange,
    marginLeft: 4,
  },
  itemCost: {
    fontSize: 13,
    fontWeight: '600',
    color: brand.success,
    marginLeft: 4,
  },
  deleteBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: brand.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: brand.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 14,
    color: brand.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
