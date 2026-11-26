import { describe, expect, it } from 'vitest'

import { normalizeInfrastructureStatus } from './InfrastructureStatusBadge'

describe('normalizeInfrastructureStatus', () => {
  it('maps numeric codes and API enum names to canonical statuses', () => {
    expect(normalizeInfrastructureStatus(1)).toBe('ACTIVE')
    expect(normalizeInfrastructureStatus('Active')).toBe('ACTIVE')
    expect(normalizeInfrastructureStatus(2)).toBe('MAINTENANCE')
    expect(normalizeInfrastructureStatus('Maintenance')).toBe('MAINTENANCE')
    expect(normalizeInfrastructureStatus(3)).toBe('INACTIVE')
    expect(normalizeInfrastructureStatus('Inactive')).toBe('INACTIVE')
  })

  it('returns null for an unrecognized status', () => {
    expect(normalizeInfrastructureStatus('unknown')).toBeNull()
  })
})
