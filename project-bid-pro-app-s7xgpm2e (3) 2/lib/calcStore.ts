import { create } from 'zustand';
import { CalculationResult, AutoTruckResult } from './calculations';
import { MeasureSystem, WeightUnit } from '../hooks/useWeightUnit';

/**
 * Cross-screen handoff for the calculator result flow.
 *
 * Flow:
 *  1. Calculator computes a result, calls `setPending(...)` with the result
 *     and the save handler, then navigates to /calculating.
 *  2. /calculating shows a 1s pulsing splash, then router.replace('/result').
 *  3. /result reads the pending data and wires the Save button.
 */

export interface PendingResult {
  result: CalculationResult;
  autoTruck: AutoTruckResult | null;
  materialCostRaw: number | undefined;
  costUnit: WeightUnit;
  system: MeasureSystem;
  truckMode: 'auto' | 'manual';
  truckId: string;
  onSave: () => void;
}

interface CalcStore {
  pending: PendingResult | null;
  setPending: (p: PendingResult) => void;
  clear: () => void;
}

export const useCalcStore = create<CalcStore>((set) => ({
  pending: null,
  setPending: (p) => set({ pending: p }),
  clear: () => set({ pending: null }),
}));
