import { describe, expect, it } from 'vitest'

import { isTerminalMissionStatus, parseInitialContext } from './utils'

describe('parseInitialContext', () => {
  it('accepts JSON objects', () => {
    expect(parseInitialContext('{"query":"robot"}')).toEqual({ query: 'robot' })
  })

  it('rejects invalid JSON and non-object values', () => {
    expect(() => parseInitialContext('{')).toThrow('valid JSON')
    expect(() => parseInitialContext('[]')).toThrow('JSON object')
    expect(() => parseInitialContext('null')).toThrow('JSON object')
  })
})

describe('isTerminalMissionStatus', () => {
  it('recognizes terminal states case-insensitively', () => {
    expect(isTerminalMissionStatus('completed')).toBe(true)
    expect(isTerminalMissionStatus('CANCELLED')).toBe(true)
    expect(isTerminalMissionStatus('RUNNING')).toBe(false)
  })
})
