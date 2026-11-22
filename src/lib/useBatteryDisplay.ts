import { useEffect, useState } from 'react'

// keep the battery display value stable, only update if the value changes by 0.75% or more
export function batteryDisplayValue(value: number | null | undefined, previous: number | null): number | null {
  if (value == null || !Number.isFinite(value) || value < 0 || value > 100) return null
  if (previous === null || Math.abs(value - previous) >= 0.75) return Math.round(value)
  return previous
}

export function useBatteryDisplay(value: number | null | undefined, runtimeId: string | undefined): number | null {
  const [state, setState] = useState<{ runtimeId: string | undefined; value: number | null }>({
    runtimeId,
    value: batteryDisplayValue(value, null),
  })

  useEffect(() => {
    setState((previous) => ({
      runtimeId,
      value: batteryDisplayValue(value, previous.runtimeId === runtimeId ? previous.value : null),
    }))
  }, [value, runtimeId])

  if (value == null || !Number.isFinite(value) || value < 0 || value > 100) return null
  return state.runtimeId === runtimeId ? state.value : batteryDisplayValue(value, null)
}
