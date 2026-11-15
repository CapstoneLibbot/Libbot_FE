import { shelfApi } from '@/features/shelves/api/shelfApi'

export interface ShelfOption {
  id: string
  shelfCode: string
  shelfName: string
  levelNumber: number
  levelName: string
  floorName: string
  aisleName: string
  targetCategoryId: number // 1: CS, 2: Literature, 3: Reference
}

export const shelfOptions: ShelfOption[] = [
  {
    id: '1',
    shelfCode: 'SH-001',
    shelfName: 'Shelf A-01',
    levelNumber: 1,
    levelName: 'Level 1',
    floorName: 'Floor 1',
    aisleName: 'Aisle A',
    targetCategoryId: 1,
  },
  {
    id: '2',
    shelfCode: 'SH-001',
    shelfName: 'Shelf A-01',
    levelNumber: 2,
    levelName: 'Level 2',
    floorName: 'Floor 1',
    aisleName: 'Aisle A',
    targetCategoryId: 1,
  },
  {
    id: '3',
    shelfCode: 'SH-001',
    shelfName: 'Shelf A-01',
    levelNumber: 3,
    levelName: 'Level 3',
    floorName: 'Floor 1',
    aisleName: 'Aisle A',
    targetCategoryId: 1,
  },
  {
    id: '4',
    shelfCode: 'SH-002',
    shelfName: 'Shelf A-02',
    levelNumber: 1,
    levelName: 'Level 1',
    floorName: 'Floor 1',
    aisleName: 'Aisle A',
    targetCategoryId: 2,
  },
  {
    id: '5',
    shelfCode: 'SH-002',
    shelfName: 'Shelf A-02',
    levelNumber: 2,
    levelName: 'Level 2',
    floorName: 'Floor 1',
    aisleName: 'Aisle A',
    targetCategoryId: 2,
  },
  {
    id: '7',
    shelfCode: 'SH-003',
    shelfName: 'Shelf B-01',
    levelNumber: 1,
    levelName: 'Level 1',
    floorName: 'Floor 1',
    aisleName: 'Aisle B',
    targetCategoryId: 3,
  },
  {
    id: '8',
    shelfCode: 'SH-003',
    shelfName: 'Shelf B-01',
    levelNumber: 2,
    levelName: 'Level 2',
    floorName: 'Floor 1',
    aisleName: 'Aisle B',
    targetCategoryId: 3,
  },
]

export async function fetchShelfOptions(): Promise<ShelfOption[]> {
  try {
    const res = await shelfApi.getShelves({ page: 1, pageSize: 100, expand: 'levels' })
    const shelves = res?.items || []
    const mapped: ShelfOption[] = []
    for (const shelf of shelves) {
      for (const level of shelf.levels || []) {
        mapped.push({
          id: String(level.id),
          shelfCode: shelf.name,
          shelfName: shelf.name,
          levelNumber: level.levelNumber,
          levelName: level.name || `Level ${level.levelNumber}`,
          floorName: 'Floor 1',
          aisleName: shelf.aisle?.name || 'Aisle A',
          targetCategoryId: 1,
        })
      }
    }
    return mapped.length > 0 ? mapped : shelfOptions
  } catch {
    return shelfOptions
  }
}

