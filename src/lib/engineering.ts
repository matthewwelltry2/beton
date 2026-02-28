import { concreteClasses, type ConcreteClass } from '@/data/concreteClasses';

export const calcHydroDepthFromMpa = (mpa: number): number => mpa * 100;

export const calcEffectiveRequiredStrength = (
  baseMpa: number,
  loadMultiplier: number,
  envFactor: number,
): number => baseMpa * loadMultiplier * (1 + envFactor);

export const pickConcreteClassByStrength = (requiredMpa: number): ConcreteClass => {
  const sorted = [...concreteClasses].sort((a, b) => a.strengthMPa - b.strengthMPa);
  return sorted.find((item) => item.strengthMPa >= requiredMpa) ?? sorted[sorted.length - 1];
};

export const formatMpa = (value: number, digits = 1): string => `${value.toFixed(digits)} МПа`;
