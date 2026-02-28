import { describe, expect, it } from 'vitest';
import { concreteClasses } from '@/data/concreteClasses';
import {
  calcEffectiveRequiredStrength,
  calcHydroDepthFromMpa,
  formatMpa,
  pickConcreteClassByStrength,
} from '@/lib/engineering';

describe('engineering helpers', () => {
  it('contains extended class range up to B90', () => {
    expect(concreteClasses[0].name).toBe('B10');
    expect(concreteClasses[concreteClasses.length - 1].name).toBe('B90');
  });

  it('picks exact class when strength matches boundary', () => {
    const exact = concreteClasses[3];
    const selected = pickConcreteClassByStrength(exact.strengthMPa);
    expect(selected.name).toBe(exact.name);
  });

  it('picks nearest higher class for in-between strength', () => {
    const selected = pickConcreteClassByStrength(40);
    expect(selected.name).toBe('B35');
  });

  it('picks highest class for overflow strength', () => {
    const selected = pickConcreteClassByStrength(200);
    expect(selected.name).toBe(concreteClasses[concreteClasses.length - 1].name);
  });

  it('converts MPa to hydro depth with 1 MPa = 100 m', () => {
    expect(calcHydroDepthFromMpa(1)).toBe(100);
    expect(calcHydroDepthFromMpa(32.7)).toBeCloseTo(3270, 5);
  });

  it('calculates effective required strength from load and environment factors', () => {
    const required = calcEffectiveRequiredStrength(30, 1.2, 0.1);
    expect(required).toBeCloseTo(39.6, 5);
  });

  it('formats MPa values with requested precision', () => {
    expect(formatMpa(32.74)).toBe('32.7 МПа');
    expect(formatMpa(32.74, 2)).toBe('32.74 МПа');
  });
});
