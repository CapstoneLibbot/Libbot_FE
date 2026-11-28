import { describe, expect, it } from 'vitest'

import { isTerminalJobStatus, parseInitialContext } from './utils'

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

describe('isTerminalJobStatus', () => {
  it('recognizes terminal states case-insensitively', () => {
    expect(isTerminalJobStatus('completed')).toBe(true)
    expect(isTerminalJobStatus('CANCELLED')).toBe(true)
    expect(isTerminalJobStatus('RUNNING')).toBe(false)
  })
})
