export function parseInitialContext(value: string): Record<string, unknown> {
  let parsed: unknown
  try {
    parsed = JSON.parse(value || '{}')
  } catch {
    throw new Error('Initial context must be valid JSON.')
  }
  if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
    throw new Error('Initial context must be a JSON object.')
  }
  return parsed as Record<string, unknown>
}

export function isTerminalMissionStatus(status?: string | null): boolean {
  return ['SUCCEEDED', 'COMPLETED', 'FAILED', 'CANCELLED'].includes(
    String(status ?? '').toUpperCase(),
  )
}
