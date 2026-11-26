import { describe, expect, it } from 'vitest'
import { groupBookItemsByShelfLevel } from './shelfLevelItems'

describe('groupBookItemsByShelfLevel', () => {
  it('includes items by expected or current shelf level without duplicates', () => {
    const expectedOnly = { id: 'expected', expectedShelfLevelId: 'level-1', currentShelfLevelId: null }
    const currentOnly = { id: 'current', expectedShelfLevelId: null, currentShelfLevelId: 'level-1' }
    const both = { id: 'both', expectedShelfLevelId: 'level-1', currentShelfLevelId: 'level-1' }
    const unrelated = { id: 'unrelated', expectedShelfLevelId: 'level-2', currentShelfLevelId: null }

    const grouped = groupBookItemsByShelfLevel(
      [expectedOnly, currentOnly, both, unrelated],
      ['level-1'],
    )

    expect(grouped['level-1'].map((item) => item.id)).toEqual(['expected', 'current', 'both'])
  })

  it('groups a book item under both levels when its expected and current levels differ', () => {
    const item = { id: 'misplaced', expectedShelfLevelId: 'level-1', currentShelfLevelId: 'level-2' }

    const grouped = groupBookItemsByShelfLevel([item], ['level-1', 'level-2'])

    expect(grouped['level-1']).toEqual([item])
    expect(grouped['level-2']).toEqual([item])
  })
})
