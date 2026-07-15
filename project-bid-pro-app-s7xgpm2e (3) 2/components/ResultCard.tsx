import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { brand } from '@/constants/theme';
import { CalculationResult } from '@/lib/calculations';
import { WeightUnit, MeasureSystem, unitLabel, convertTons } from '@/hooks/useWeightUnit';

interface ResultCardProps {
  result: CalculationResult;
  materialCostPerYard?: number;
  costInputRaw?: number;
  costUnit?: WeightUnit;
  system?: MeasureSystem;
  onSave: () => void;
}

function StatRow({
  label,
  value,
  highlight = false,
  accent = false,
  sublabel,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  accent?: boolean;
  sublabel?: string;
}) {
  return (
    <View style={styles.statRow}>
      <View style={styles.statLabelCol}>
        <Text style={styles.statLabel}>{label}</Text>
        {sublabel ? <Text style={styles.statSublabel}>{sublabel}</Text> : null}
      </View>
      <Text
        style={[
          styles.statValue,
          highlight && styles.statHighlight,
          accent && styles.statAccent,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );
}

export function ResultCard({ result, materialCostPerYard, costInputRaw, costUnit = 'CY', system = 'US', onSave }: ResultCardProps) {
  const totalCost = materialCostPerYard
    ? (result.cubicYards * materialCostPerYard).toFixed(2)
    : null;

  const orderTotalCost =
    materialCostPerYard && result.orderCY
      ? (result.orderCY * materialCostPerYard).toFixed(2)
      : null;

  const hasGravelDirt = result.compactedCY !== undefined;
  const hasAsphalt = result.compactionFactor !== undefined && result.compactedCY === undefined && result.tons !== undefined;
  const hasConcrete = result.wasteAdjustedCY !== undefined;

  const showTonsPrimary = result.tons !== undefined;
  const isMetric = system === 'metric';
  const tonsLabel = isMetric ? 'TONNES (NET)' : 'TONS (NET)';
  const tonsWord = isMetric ? 'tonnes' : 'tons';
  // Convert short tons → metric tonnes if needed
  const displayTons = result.tons !== undefined ? convertTons(result.tons, system) : undefined;

  // Order tons — use pre-calculated value from result (already includes compaction)
  const orderTons = result.orderTons !== undefined
    ? convertTons(result.orderTons, system)
    : undefined;

  // For concrete/no-tons: order value in CY
  const orderBannerValue = orderTons
    ? `${orderTons.toFixed(1)} ${tonsWord}`
    : result.orderCY
    ? `${result.orderCY.toFixed(1)} CY`
    : null;

  return (
    <View style={styles.card}>
      {/* Primary result — always show ORDER amount so contractor knows what to call in */}
      <View style={styles.mainResult}>
        {showTonsPrimary && orderTons ? (
          <>
            <Text style={styles.resultLabel}>
              {isMetric ? 'ORDER AMOUNT (TONNES)' : 'ORDER AMOUNT (TONS)'}
            </Text>
            <Text style={styles.resultValue}>{orderTons.toFixed(1)}</Text>
          </>
        ) : showTonsPrimary ? (
          <>
            <Text style={styles.resultLabel}>{tonsLabel}</Text>
            <Text style={styles.resultValue}>{displayTons!.toFixed(1)}</Text>
            <Text style={styles.resultSub}>{result.cubicFeet.toFixed(1)} cu ft</Text>
          </>
        ) : result.orderCY ? (
          <>
            <Text style={styles.resultLabel}>ORDER AMOUNT (CY)</Text>
            <Text style={styles.resultValue}>{result.orderCY.toFixed(2)}</Text>
            {result.compactionFactor !== undefined && (
              <Text style={styles.resultSub}>
                incl. {((result.compactionFactor - 1) * 100).toFixed(0)}% compaction · {result.cubicYards.toFixed(2)} CY net
              </Text>
            )}
            {result.wasteAdjustedCY !== undefined && (
              <Text style={styles.resultSub}>
                incl. {result.wasteFactor != null ? ((result.wasteFactor - 1) * 100).toFixed(0) : '10'}% waste · {result.cubicYards.toFixed(2)} CY net
              </Text>
            )}
            {result.compactionFactor === undefined && result.wasteAdjustedCY === undefined && (
              <Text style={styles.resultSub}>{result.cubicFeet.toFixed(1)} cubic feet</Text>
            )}
          </>
        ) : (
          <>
            <Text style={styles.resultLabel}>CUBIC YARDS (NET)</Text>
            <Text style={styles.resultValue}>{result.cubicYards.toFixed(2)}</Text>
            <Text style={styles.resultSub}>{result.cubicFeet.toFixed(1)} cubic feet</Text>
          </>
        )}
      </View>

      {/* ORDER RECOMMENDATION banner — concrete/footing only (gravel/dirt already shown in hero) */}
      {result.orderCY !== undefined && !showTonsPrimary && (
        <View style={styles.orderBanner}>
          <View style={styles.orderBannerLeft}>
            <Ionicons name="cart" size={18} color={brand.orange} />
            <View>
              <Text style={styles.orderBannerLabel}>CONFIRM ORDER</Text>
              {result.wasteAdjustedCY !== undefined && (
                <Text style={styles.orderBannerSub}>
                  incl. {result.wasteFactor != null ? ((result.wasteFactor - 1) * 100).toFixed(0) : '10'}% waste/spill factor
                </Text>
              )}
            </View>
          </View>
          <Text style={styles.orderBannerValue}>{orderBannerValue}</Text>
        </View>
      )}

      <View style={styles.stats}>

        {/* COMPACTION section for gravel/dirt */}
        {hasGravelDirt && (
          <>
            <SectionHeader title="BREAKDOWN" />
            <StatRow
              label="Net (no compaction)"
              value={displayTons ? `${displayTons.toFixed(1)} ${tonsWord}` : `${result.cubicYards.toFixed(2)} CY`}
              sublabel="Pure volume of the space to fill"
            />
            <StatRow
              label={`Compaction Factor`}
              value={`+${((result.compactionFactor! - 1) * 100).toFixed(0)}%`}
              sublabel="Loose material settles when compacted"
            />
            <StatRow
              label="Order Amount"
              value={orderTons ? `${orderTons.toFixed(1)} ${tonsWord}` : `${result.compactedCY!.toFixed(2)} CY`}
              sublabel={undefined}
              highlight
            />
          </>
        )}

        {/* COMPACTION section for asphalt */}
        {hasAsphalt && (
          <>
            <SectionHeader title="BREAKDOWN" />
            <StatRow
              label="Net (compacted volume)"
              value={displayTons ? `${displayTons.toFixed(1)} ${tonsWord}` : `${result.cubicYards.toFixed(2)} CY`}
              sublabel="Finished depth after compaction"
            />
            <StatRow
              label="Compaction Factor"
              value={`+${((result.compactionFactor! - 1) * 100).toFixed(0)}%`}
              sublabel="Loose hot mix needed above compacted volume"
            />
            <StatRow
              label="Order Amount"
              value={orderTons ? `${orderTons.toFixed(1)} ${tonsWord}` : '—'}
              sublabel={undefined}
              highlight
            />
          </>
        )}

        {/* WASTE section for concrete */}
        {hasConcrete && (
          <>
            <SectionHeader title="WASTE / SPILL FACTOR" />
            <StatRow
              label={`With ${result.wasteFactor != null ? ((result.wasteFactor - 1) * 100).toFixed(0) : '10'}% Waste`}
              value={`${result.wasteAdjustedCY!.toFixed(2)} CY`}
              sublabel={result.wasteFactor === 1.10 ? 'Industry standard' : 'Custom allowance'}
              highlight
            />
          </>
        )}

        {/* CONCRETE BAGS section */}
        {result.bags !== undefined && (
          <>
            <SectionHeader title="ALTERNATIVE" />
            <StatRow
              label="80 lb Bags (approx)"
              value={`${result.bags} bags`}
              sublabel="For small pours only"
            />
          </>
        )}

        {/* COST section */}
        {materialCostPerYard && (
          <>
            <SectionHeader title="COST ESTIMATE" />
            {orderTotalCost && result.orderCY ? (
              <StatRow
                label={`At $${costInputRaw ?? materialCostPerYard}${unitLabel(costUnit)}`}
                value={`$${parseFloat(orderTotalCost).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`}
                accent
              />
            ) : (
              <StatRow
                accent
                label={`At $${costInputRaw ?? materialCostPerYard}${unitLabel(costUnit)}`}
                value={`$${parseFloat(totalCost!).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`}
              />
            )}
          </>
        )}
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={onSave}
          activeOpacity={0.8}
        >
          <Ionicons name="bookmark-outline" size={18} color={brand.bg} />
          <Text style={styles.saveBtnText}>Save Calculation</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: brand.bgElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: brand.border,
    overflow: 'hidden',
    marginTop: 8,
  },
  mainResult: {
    backgroundColor: brand.orange,
    padding: 20,
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  resultValue: {
    fontSize: 52,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  resultSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 2,
    fontWeight: '500',
  },
  orderBanner: {
    backgroundColor: 'rgba(249,115,22,0.12)',
    borderBottomWidth: 1,
    borderBottomColor: brand.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  orderBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderBannerLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: brand.orange,
    letterSpacing: 1,
  },
  orderBannerSub: {
    fontSize: 11,
    color: brand.textTertiary,
    marginTop: 2,
    fontWeight: '500',
  },
  orderBannerValue: {
    fontSize: 20,
    fontWeight: '800',
    color: brand.orange,
  },
  stats: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  sectionHeader: {
    marginTop: 12,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: brand.border,
    paddingBottom: 4,
  },
  sectionHeaderText: {
    fontSize: 10,
    fontWeight: '700',
    color: brand.textPrimary,
    letterSpacing: 1.5,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
  },
  statLabelCol: {
    flex: 1,
    paddingRight: 8,
  },
  statLabel: {
    fontSize: 14,
    color: brand.textSecondary,
  },
  statSublabel: {
    fontSize: 11,
    color: brand.textTertiary,
    marginTop: 1,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '600',
    color: brand.textPrimary,
  },
  statHighlight: {
    color: brand.orange,
  },
  statAccent: {
    color: brand.success,
  },
  actionRow: {
    margin: 16,
    marginTop: 8,
  },
  saveBtn: {
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: brand.orange,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: brand.bg,
  },
});
