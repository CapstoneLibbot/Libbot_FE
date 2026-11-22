import { describe, expect, it } from 'vitest'
import { batteryDisplayValue } from './useBatteryDisplay'

describe('batteryDisplayValue', () => {
  it('holds its value around a rounding boundary and follows meaningful changes', () => {
    let displayed = batteryDisplayValue(15.4, null)
    expect(displayed).toBe(15)
    displayed = batteryDisplayValue(15.6, displayed)
    expect(displayed).toBe(15)
    displayed = batteryDisplayValue(15.8, displayed)
    expect(displayed).toBe(16)
    expect(batteryDisplayValue(15.4, displayed)).toBe(16)
    expect(batteryDisplayValue(15.2, displayed)).toBe(15)
    expect(batteryDisplayValue(30, displayed)).toBe(30)
  })

  it('clears missing and invalid readings', () => {
    for (const value of [null, undefined, NaN, -1, 101]) {
      expect(batteryDisplayValue(value, 15)).toBeNull()
    }
  })
})
