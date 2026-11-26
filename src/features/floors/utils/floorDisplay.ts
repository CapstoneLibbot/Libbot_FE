export function localizeFloorName(name: string): string {
  return name.replace(/\bTầng\b/gi, 'Lầu')
}
