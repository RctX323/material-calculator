/**
 * Bid Pro — Material Calculation Engine
 * All calculations follow imperial units (feet/inches → cubic yards)
 */

export type CalculationType = 'gravel' | 'dirt' | 'asphalt' | 'concrete_pad' | 'footing';

export interface GravelInputs {
  length: number;  // feet
  width: number;   // feet
  depth: number;   // inches
}

export interface DirtInputs {
  length: number;  // feet
  width: number;   // feet
  depth: number;   // inches
}

export interface ConcretePadInputs {
  length: number;  // feet
  width: number;   // feet
  depth: number;   // inches
}

export interface FootingInputs {
  perimeter: number; // feet (total linear feet of footing)
  width: number;     // inches
  depth: number;     // inches
}

export interface AsphaltInputs {
  length: number;  // feet
  width: number;   // feet
  depth: number;   // inches
}

export type CalculationInputs = GravelInputs | DirtInputs | AsphaltInputs | ConcretePadInputs | FootingInputs;

export interface CalculationResult {
  cubicFeet: number;
  cubicYards: number;
  tons?: number;              // for gravel/dirt/asphalt
  orderTons?: number;         // tons to order (rounded up, after compaction)
  loads?: number;             // truckloads based on selected truck
  truckTons?: number;         // capacity of selected truck in tons
  bags?: number;              // 80lb bags (for small concrete jobs)
  compactedCY?: number;       // compaction-adjusted volume (gravel/dirt)
  orderCY?: number;           // recommended order amount (rounded up to nearest 0.5 CY)
  wasteAdjustedCY?: number;   // with waste factor (concrete)
  wasteFactor?: number;       // waste multiplier used (e.g. 1.10 = 10%)
  halfLoads?: number;         // half truck loads
  compactionFactor?: number;  // compaction factor used
}

// Convert cubic feet to cubic yards
const toCubicYards = (cubicFeet: number) => cubicFeet / 27;

// Material density (tons per cubic yard)
const DENSITY = {
  gravel: 1.4,    // ~1.4 tons/CY for crushed stone
  dirt: 1.0,      // ~1.0 tons/CY for fill dirt
  asphalt: 1.96,  // ~145 lbs/ft³ compacted hot mix = ~1.96 tons/CY
  concrete: 2.0,  // ~2.0 tons/CY for concrete
};

// Truck types — capacity in tons (legal payload weight limit)
export interface TruckType {
  id: string;
  label: string;
  shortLabel: string;
  capacityTons: number;   // US short tons (legal payload)
  capacityTonnesMetric: number; // metric tonnes
  description: string;
}

export const TRUCK_TYPES: TruckType[] = [
  { id: 'tandem_truck',   label: 'Tandem End-Dump Truck',    shortLabel: 'Tandem E/D',   capacityTons: 17, capacityTonnesMetric: 15.4, description: '17 ton — tandem axle end-dump truck' },
  { id: 'triaxle_truck',  label: 'Tri-Axle End-Dump Truck',  shortLabel: 'Tri-Axle E/D', capacityTons: 20, capacityTonnesMetric: 18.1, description: '20 ton — tri-axle end-dump truck' },
  { id: 'tandem_trailer', label: 'Tandem End-Dump Trailer',  shortLabel: 'Tandem Trl',   capacityTons: 22, capacityTonnesMetric: 20.0, description: '22 ton — tandem axle end-dump trailer' },
  { id: 'triaxle_belly',  label: 'Tri-Axle Belly Dump',      shortLabel: 'Tri Belly',    capacityTons: 25, capacityTonnesMetric: 22.7, description: '25 ton — tri-axle belly dump trailer' },
  { id: 'tandem_utility', label: 'Tandem Utility Trailer',   shortLabel: 'Utility Trl',  capacityTons: 5,  capacityTonnesMetric: 4.5,  description: '5 ton — tandem axle utility trailer' },
];

export const DEFAULT_TRUCK_ID = 'tandem_truck';

/** A single truck type and how many of it are in the fleet */
export interface FleetEntry {
  truckId: string;
  truckLabel: string;
  capacityTons: number;
  count: number;
}

/** Result of auto truck selection — may be a mixed fleet */
export interface AutoTruckResult {
  fleet: FleetEntry[];     // one or more truck types used
  totalLoads: number;      // sum of all counts
  capacityTons: number;    // kept for backward compat — primary truck capacity
  loads: number;           // kept for backward compat — same as totalLoads
  truckLabel: string;      // kept for backward compat — primary truck label
  totalTons: number;       // total tons delivered (≥ orderTons)
  extraTons: number;       // totalTons - orderTons
  efficiencyPct: number;   // orderTons / totalTons * 100
}

/**
 * Find the optimal fleet (possibly mixed truck types) to haul orderTons.
 * Rules:
 *   1. Never deliver less than orderTons.
 *   2. Minimise total loads (fewest trips).
 *   3. Among same load count, minimise extra tons delivered.
 *
 * Strategy: evaluate single-type solutions, greedy mixed-fleet with every
 * truck as base + remainder fillers, and pick the global winner.
 * Uses ALL truck types for maximum efficiency.
 */
export function bestAutoTruck(orderTons: number): AutoTruckResult {
  // Use ALL truck types for optimal fleet combinations
  const trucks = [...TRUCK_TYPES].sort((a, b) => b.capacityTons - a.capacityTons);

  const toResult = (fleet: FleetEntry[]): AutoTruckResult => {
    const totalLoads = fleet.reduce((s, e) => s + e.count, 0);
    const totalTons = fleet.reduce((s, e) => s + e.count * e.capacityTons, 0);
    const extraTons = totalTons - orderTons;
    const efficiencyPct = totalTons > 0 ? (orderTons / totalTons) * 100 : 0;
    const primary = [...fleet].sort((a, b) => b.count - a.count || b.capacityTons - a.capacityTons)[0];
    return { fleet, totalLoads, loads: totalLoads, capacityTons: primary.capacityTons, truckLabel: primary.truckLabel, totalTons, extraTons, efficiencyPct };
  };

  const candidates: AutoTruckResult[] = [];

  // 1. Single truck type solutions
  for (const truck of trucks) {
    const count = Math.ceil(orderTons / truck.capacityTons);
    candidates.push(toResult([{ truckId: truck.id, truckLabel: truck.label, capacityTons: truck.capacityTons, count }]));
  }

  // 2. For each truck as base, use greedy descending on remainder then fill
  for (const baseTruck of trucks) {
    const baseCount = Math.floor(orderTons / baseTruck.capacityTons);
    if (baseCount === 0) continue;
    const baseDelivered = baseCount * baseTruck.capacityTons;
    const remainder = orderTons - baseDelivered;
    if (remainder <= 0) {
      // Already covers it with just this truck
      continue; // already covered by single-type candidates
    }
    // Try each truck as the filler for the remainder
    for (const filler of trucks) {
      const fillerCount = Math.ceil(remainder / filler.capacityTons);
      const fleet: FleetEntry[] = [];
      // Add base
      fleet.push({ truckId: baseTruck.id, truckLabel: baseTruck.label, capacityTons: baseTruck.capacityTons, count: baseCount });
      // Add filler (may be same type as base)
      if (filler.id === baseTruck.id) {
        fleet[0].count += fillerCount;
      } else {
        fleet.push({ truckId: filler.id, truckLabel: filler.label, capacityTons: filler.capacityTons, count: fillerCount });
      }
      if (fleet.reduce((s, e) => s + e.count * e.capacityTons, 0) >= orderTons) {
        candidates.push(toResult(fleet));
      }
    }
  }

  // 3. Try greedy descending across all trucks with each truck as remainder filler
  for (let startIdx = 0; startIdx < trucks.length; startIdx++) {
    const fleet: FleetEntry[] = [];
    let rem = orderTons;
    for (let i = startIdx; i < trucks.length; i++) {
      if (rem <= 0) break;
      const t = trucks[i];
      const cnt = Math.floor(rem / t.capacityTons);
      if (cnt > 0) {
        fleet.push({ truckId: t.id, truckLabel: t.label, capacityTons: t.capacityTons, count: cnt });
        rem -= cnt * t.capacityTons;
      }
    }
    if (rem > 0 && fleet.length > 0) {
      // Fill remainder with smallest truck that fits
      const filler = trucks[trucks.length - 1];
      const existing = fleet.find(e => e.truckId === filler.id);
      if (existing) {
        existing.count += Math.ceil(rem / filler.capacityTons);
      } else {
        fleet.push({ truckId: filler.id, truckLabel: filler.label, capacityTons: filler.capacityTons, count: Math.ceil(rem / filler.capacityTons) });
      }
    }
    if (fleet.length > 0 && fleet.reduce((s, e) => s + e.count * e.capacityTons, 0) >= orderTons) {
      candidates.push(toResult(fleet));
    }
  }

  // Pick winner: fewest loads, then least extra tons
  candidates.sort((a, b) =>
    a.totalLoads !== b.totalLoads
      ? a.totalLoads - b.totalLoads
      : a.extraTons - b.extraTons
  );

  return candidates[0];
}

// 80lb bag = 0.6 cu ft = 0.0222 CY
const BAG_CUBIC_YARDS = 0.022;

// Compaction factors (loose material needed to achieve compacted volume)
const COMPACTION = {
  gravel: 1.25,  // 25% more loose material needed (gravel compacts ~20%)
  dirt: 1.30,    // 30% more loose material needed (dirt compacts ~23%)
  asphalt: 1.25, // 25% more loose mix needed (hot mix compacts ~20%)
};

export const COMPACTION_DEFAULTS = COMPACTION;
export const COMPACTION_MIN = 1.05;   // 5% minimum
export const COMPACTION_MAX = 1.50;   // 50% maximum
export const COMPACTION_STEP = 0.05;  // 5% per tap

// Concrete/footing waste/spill factor
export const WASTE_DEFAULT = 1.10;  // 10% default
export const WASTE_MIN = 1.00;       // 0% minimum
export const WASTE_MAX = 1.25;       // 25% maximum
export const WASTE_STEP = 0.01;      // 1% per tap

// Round up to nearest 0.5 ton for ordering
const roundUpHalfTon = (t: number) => Math.ceil(t * 2) / 2;

// Round up to nearest 0.5 CY for ordering (concrete only)
const roundUpHalfYard = (cy: number) => Math.ceil(cy * 2) / 2;

export function calculateGravel(inputs: GravelInputs, compactionOverride?: number, truckTons = 17): CalculationResult {
  const { length, width, depth } = inputs;
  const depthFt = depth / 12;
  const cubicFeet = length * width * depthFt;
  const cubicYards = toCubicYards(cubicFeet);
  const tons = cubicYards * DENSITY.gravel;
  const compFactor = compactionOverride ?? COMPACTION.gravel;
  const compactedCY = cubicYards * compFactor;
  const orderTons = roundUpHalfTon(tons * compFactor);
  const loads = Math.ceil(orderTons / truckTons);

  return {
    cubicFeet: Math.round(cubicFeet * 100) / 100,
    cubicYards: Math.round(cubicYards * 100) / 100,
    tons: Math.round(tons * 100) / 100,
    orderTons,
    loads,
    truckTons,
    compactedCY: Math.round(compactedCY * 100) / 100,
    orderCY: roundUpHalfYard(compactedCY),
    compactionFactor: compFactor,
  };
}

export function calculateDirt(inputs: DirtInputs, compactionOverride?: number, truckTons = 17): CalculationResult {
  const { length, width, depth } = inputs;
  const depthFt = depth / 12;
  const cubicFeet = length * width * depthFt;
  const cubicYards = toCubicYards(cubicFeet);
  const tons = cubicYards * DENSITY.dirt;
  const compFactor = compactionOverride ?? COMPACTION.dirt;
  const compactedCY = cubicYards * compFactor;
  const orderTons = roundUpHalfTon(tons * compFactor);
  const loads = Math.ceil(orderTons / truckTons);

  return {
    cubicFeet: Math.round(cubicFeet * 100) / 100,
    cubicYards: Math.round(cubicYards * 100) / 100,
    tons: Math.round(tons * 100) / 100,
    orderTons,
    loads,
    truckTons,
    compactedCY: Math.round(compactedCY * 100) / 100,
    orderCY: roundUpHalfYard(compactedCY),
    compactionFactor: compFactor,
  };
}

export function calculateAsphalt(inputs: AsphaltInputs, truckTons = 17, compactionOverride?: number): CalculationResult {
  const { length, width, depth } = inputs;
  const depthFt = depth / 12;
  const cubicFeet = length * width * depthFt;
  const cubicYards = toCubicYards(cubicFeet);
  const tons = cubicYards * DENSITY.asphalt;
  const compFactor = compactionOverride ?? COMPACTION.asphalt;
  // Apply compaction: order more loose mix than the net compacted volume
  const orderTons = roundUpHalfTon(tons * compFactor);
  const loads = Math.ceil(orderTons / truckTons);

  return {
    cubicFeet: Math.round(cubicFeet * 100) / 100,
    cubicYards: Math.round(cubicYards * 100) / 100,
    tons: Math.round(tons * 100) / 100,
    orderTons,
    loads,
    truckTons,
    compactionFactor: compFactor,
  };
}

export function calculateConcretePad(inputs: ConcretePadInputs, truckCY = 14, wasteFactor = WASTE_DEFAULT): CalculationResult {
  const { length, width, depth } = inputs;
  const depthFt = depth / 12;
  const cubicFeet = length * width * depthFt;
  const cubicYards = toCubicYards(cubicFeet);
  const wasteAdjustedCY = cubicYards * wasteFactor;
  const orderCY = roundUpHalfYard(wasteAdjustedCY);
  const bags = Math.ceil(cubicYards / BAG_CUBIC_YARDS);

  return {
    cubicFeet: Math.round(cubicFeet * 100) / 100,
    cubicYards: Math.round(cubicYards * 100) / 100,
    wasteAdjustedCY: Math.round(wasteAdjustedCY * 100) / 100,
    wasteFactor,
    orderCY,
    bags,
  };
}

export function calculateFooting(inputs: FootingInputs, truckCY = 14, wasteFactor = WASTE_DEFAULT): CalculationResult {
  const { perimeter, width, depth } = inputs;
  const widthFt = width / 12;
  const depthFt = depth / 12;
  const cubicFeet = perimeter * widthFt * depthFt;
  const cubicYards = toCubicYards(cubicFeet);
  const wasteAdjustedCY = cubicYards * wasteFactor;
  const orderCY = roundUpHalfYard(wasteAdjustedCY);
  const bags = Math.ceil(cubicYards / BAG_CUBIC_YARDS);

  return {
    cubicFeet: Math.round(cubicFeet * 100) / 100,
    cubicYards: Math.round(cubicYards * 100) / 100,
    wasteAdjustedCY: Math.round(wasteAdjustedCY * 100) / 100,
    wasteFactor,
    orderCY,
    bags,
  };
}

export function getDefaultInputs(type: CalculationType): CalculationInputs {
  switch (type) {
    case 'gravel':
      return { length: 0, width: 0, depth: 4 };
    case 'dirt':
      return { length: 0, width: 0, depth: 6 };
    case 'asphalt':
      return { length: 0, width: 0, depth: 3 }; // 3 inches typical driveway
    case 'concrete_pad':
      return { length: 0, width: 0, depth: 4 };
    case 'footing':
      return { perimeter: 0, width: 16, depth: 8 };
  }
}

export function formatCubicYards(cy: number): string {
  return cy.toFixed(2);
}

export function getTypeLabel(type: CalculationType): string {
  switch (type) {
    case 'gravel': return 'Gravel';
    case 'dirt': return 'Dirt / Fill';
    case 'asphalt': return 'Asphalt';
    case 'concrete_pad': return 'Concrete Pad';
    case 'footing': return 'Footing';
  }
}

export function getTypeIcon(type: CalculationType): string {
  switch (type) {
    case 'gravel': return 'layers';
    case 'dirt': return 'earth';
    case 'asphalt': return 'car';
    case 'concrete_pad': return 'grid';
    case 'footing': return 'construct';
  }
}