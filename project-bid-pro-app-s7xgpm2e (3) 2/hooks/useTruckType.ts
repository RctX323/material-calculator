import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TRUCK_TYPES, TruckType, DEFAULT_TRUCK_ID } from '@/lib/calculations';

const STORAGE_KEY = '@bidpro:truckTypeId';

export function useTruckType() {
  const [truckId, setTruckIdState] = useState<string>(DEFAULT_TRUCK_ID);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(val => {
      if (val && TRUCK_TYPES.find(t => t.id === val)) {
        setTruckIdState(val);
      }
      setLoaded(true);
    });
  }, []);

  const setTruckId = useCallback(async (id: string) => {
    setTruckIdState(id);
    await AsyncStorage.setItem(STORAGE_KEY, id);
  }, []);

  const truck: TruckType = TRUCK_TYPES.find(t => t.id === truckId) ?? TRUCK_TYPES[0];

  return { truckId, truck, setTruckId, loaded };
}
