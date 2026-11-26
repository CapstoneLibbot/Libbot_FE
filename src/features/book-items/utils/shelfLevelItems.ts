interface ShelfLevelLocation {
  expectedShelfLevelId: string | null
  currentShelfLevelId: string | null
}

export function groupBookItemsByShelfLevel<T extends ShelfLevelLocation>(
  items: T[],
  levelIds: string[],
): Record<string, T[]> {
  const levelIdSet = new Set(levelIds)
  const itemsByLevel = Object.fromEntries(levelIds.map((levelId) => [levelId, []])) as Record<
    string,
    T[]
  >

  items.forEach((item) => {
    const matchingLevelIds = new Set(
      [item.currentShelfLevelId, item.expectedShelfLevelId].filter(
        (levelId): levelId is string => levelId !== null && levelIdSet.has(levelId),
      ),
    )
    matchingLevelIds.forEach((levelId) => itemsByLevel[levelId].push(item))
  })

  return itemsByLevel
}
