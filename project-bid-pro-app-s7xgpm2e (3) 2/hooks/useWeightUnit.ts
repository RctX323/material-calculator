/**
 * Measurement system + cost unit for Bid Pro
 *
 * MeasureSystem ('US' | 'metric'):
 *   - Controls weight display everywhere (tons vs tonnes)
 *   - Set once on first launch, persists forever
 *   - Can be changed via header toggle or Settings
 *
 * CostUnit ('ton' | 'tonne' | 'CY'):
 *   - How the user enters material cost
 *   - Defaults to match the system (ton for US, tonne for metric)
 *   - User can override to 'CY' for gravel/dirt if their supplier quotes by yard
 *   - Concrete/footing always uses 'CY' (not stored, derived)
 */
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type WeightUnit = 'CY' | 'ton' | 'tonne';
export type MeasureSystem = 'US' | 'metric';

const SYSTEM_KEY   = '@bidpro:measureSystem';
const COST_KEY     = '@bidpro:costUnit';
const ONBOARDED_KEY = '@bidpro:onboarded';

// ─── Measurement system ────────────────────────────────────────────────────────

export function useMeasureSystem() {
  const [system, setSystemState] = useState<MeasureSystem>('US');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(SYSTEM_KEY).then(val => {
      if (val === 'US' || val === 'metric') setSystemState(val as MeasureSystem);
      setLoaded(true);
    });
  }, []);

  const setSystem = useCallback(async (next: MeasureSystem) => {
    setSystemState(next);
    await AsyncStorage.setItem(SYSTEM_KEY, next);
  }, []);

  // Derived weight unit for backward compat
  const unit: WeightUnit = system === 'metric' ? 'tonne' : 'ton';

  return { system, setSystem, unit, loaded };
}

// ─── Cost unit (independent — can be weight unit or CY) ───────────────────────

export function useCostUnit(system: MeasureSystem) {
  const defaultUnit: WeightUnit = system === 'metric' ? 'tonne' : 'ton';
  const [costUnit, setCostUnitState] = useState<WeightUnit>(defaultUnit);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(COST_KEY).then(val => {
      if (val === 'ton' || val === 'tonne' || val === 'CY') {
        setCostUnitState(val as WeightUnit);
      } else {
        // No saved value — default to system weight unit
        setCostUnitState(defaultUnit);
      }
      setLoaded(true);
    });
  // Re-run if system changes so default stays in sync
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [system]);

  const setCostUnit = useCallback(async (next: WeightUnit) => {
    setCostUnitState(next);
    await AsyncStorage.setItem(COST_KEY, next);
  }, []);

  return { costUnit, setCostUnit, loaded };
}

// ─── First-launch onboarding flag ─────────────────────────────────────────────

export async function getOnboarded(): Promise<boolean> {
  const val = await AsyncStorage.getItem(ONBOARDED_KEY);
  return val === 'true';
}

export async function markOnboarded(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDED_KEY, 'true');
}

// ─── Legacy hook (backward compat for settings screen) ────────────────────────

export function useWeightUnit() {
  const { unit, system, setSystem, loaded } = useMeasureSystem();
  const setUnit = useCallback(async (u: WeightUnit) => {
    await setSystem(u === 'tonne' ? 'metric' : 'US');
  }, [setSystem]);
  return { unit, setUnit, loaded };
}

// ─── Utility helpers ──────────────────────────────────────────────────────────

/**
 * Convert a user-entered cost to $/CY for math.
 * If unit is 'CY' returns as-is. Otherwise converts via material density.
 */
export function costPerYardFromUnit(
  costInput: number,
  unit: WeightUnit,
  cubicYards: number,
  tons: number | undefined,
): number {
  if (unit === 'CY') return costInput;
  if (!tons || tons === 0) return costInput;
  const density = tons / cubicYards;
  return costInput * density;
}

export function unitLabel(unit: WeightUnit): string {
  switch (unit) {
    case 'CY':    return '/ CY';
    case 'ton':   return '/ ton';
    case 'tonne': return '/ tonne';
  }
}

export function weightLabel(system: MeasureSystem): string {
  return system === 'metric' ? 'tonnes' : 'tons';
}

export function convertTons(shortTons: number, system: MeasureSystem): number {
  return system === 'metric' ? shortTons * 0.907185 : shortTons;
}
