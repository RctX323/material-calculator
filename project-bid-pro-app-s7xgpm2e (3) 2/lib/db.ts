import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'bidpro_calculations_v1';

export interface CalculationRecord {
  id: string;
  type: string;
  name: string;
  inputs: string;
  result: string;
  unit: string;
  materialCost?: number;
  totalCost?: number;
  notes?: string;
  createdAt: string;
}

async function readAll(): Promise<CalculationRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('[db] readAll failed:', e);
    return [];
  }
}

async function writeAll(records: CalculationRecord[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function genId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function getCalculations(): Promise<CalculationRecord[]> {
  const all = await readAll();
  return all.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function saveCalculation(
  data: Omit<CalculationRecord, 'id' | 'createdAt'>
): Promise<CalculationRecord> {
  const record: CalculationRecord = {
    ...data,
    id: genId(),
    createdAt: new Date().toISOString(),
  };
  const all = await readAll();
  all.unshift(record);
  const trimmed = all.slice(0, 500);
  await writeAll(trimmed);
  return record;
}

export async function deleteCalculation(id: string): Promise<void> {
  const all = await readAll();
  const next = all.filter(r => r.id !== id);
  await writeAll(next);
}

export function parseInputs(inputs: string): Record<string, number> {
  try {
    return JSON.parse(inputs);
  } catch {
    return {};
  }
}
