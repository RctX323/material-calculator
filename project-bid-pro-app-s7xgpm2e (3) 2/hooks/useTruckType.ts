import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  TRUCK_TYPES,
  TruckType,
  DEFAULT_TRUCK_ID,
  PERSONAL_TRUCK_ID,
  DEFAULT_PERSONAL_TONS,
  MIN_PERSONAL_TONS,
  MAX_PERSONAL_TONS,
  makePersonalTruck,
} from '@/lib/calculations';

const STORAGE_KEY = '@bidpro:truckTypeId';
const PERSONAL_KEY = '@bidpro:personalTruckTons';

// Clamp a user-entered capacity into the sane range.
function clampTons(n: number): number {
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_PERSONAL_TONS;
  return Math.min(MAX_PERSONAL_TONS, Math.max(MIN_PERSONAL_TONS, n));
}

export function useTruckType() {
  const [truckId, setTruckIdState] = useState<string>(DEFAULT_TRUCK_ID);
  const [personalTons, setPersonalTonsState] = useState<number>(DEFAULT_PERSONAL_TONS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(STORAGE_KEY),
      AsyncStorage.getItem(PERSONAL_KEY),
    ]).then(([id, tons]) => {
      if (id && (id === PERSONAL_TRUCK_ID || TRUCK_TYPES.find(t => t.id === id))) {
        setTruckIdState(id);
      }
      const parsed = tons != null ? parseFloat(tons) : NaN;
      if (Number.isFinite(parsed)) setPersonalTonsState(clampTons(parsed));
      setLoaded(true);
    });
  }, []);

  const setTruckId = useCallback(async (id: string) => {
    setTruckIdState(id);
    await AsyncStorage.setItem(STORAGE_KEY, id);
  }, []);

  const setPersonalTons = useCallback(async (tons: number) => {
    const clamped = clampTons(tons);
    setPersonalTonsState(clamped);
    await AsyncStorage.setItem(PERSONAL_KEY, String(clamped));
  }, []);

  // Resolve the active truck. The Personal Truck is synthesized from the
  // user-entered capacity; standard types come from TRUCK_TYPES.
  const truck: TruckType =
    truckId === PERSONAL_TRUCK_ID
      ? makePersonalTruck(personalTons)
      : TRUCK_TYPES.find(t => t.id === truckId) ?? TRUCK_TYPES[0];

  return { truckId, truck, setTruckId, personalTons, setPersonalTons, loaded };
}
