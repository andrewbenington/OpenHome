// import userEvent from '@testing-library/user-event'
import { v4 as UuidV4 } from 'uuid'
import { assert, describe, expect, test } from 'vitest'
import { SimpleOpenHomeBox, StoredBankData } from '../../../core/save/util/storage'
import { range } from '../../../core/util/functional'
import { BoxMap, createBanksAndBoxesStore } from './store'

function buildTestStoredState(): StoredBankData {
  return {
    banks: [
      {
        id: UuidV4(),
        name: 'test bank',
        index: 0,
        boxes: boxMapFromOrdered(
          range(10).map((_, index) => ({
            id: UuidV4(),
            name: `TestBox${index}`,
            index,
            identifiers: new Map(),
          }))
        ),
        current_box: 0,
      },
    ],
    current_bank: 0,
  }
}

function buildTestStore() {
  return createBanksAndBoxesStore(buildTestStoredState(), async () => {})
}

function assertIndicesMatchKeys(boxMap: BoxMap) {
  for (const [mapKeyIndex, box] of boxMap) {
    expect(box.index).toBe(mapKeyIndex)
  }
}

describe('banks and boxes store', () => {
  const store = buildTestStore()

  test('should initialize state with expected bank/box names', async () => {
    expect(store.getState().getCurrentBank().name).toBe('test bank')

    expect(store.getState().getCurrentBank().boxes.get(3)?.name).toBe('TestBox3')
  })
})

describe('box insertion', () => {
  const store = buildTestStore()

  test('inserting box at start', async () => {
    store.getState().addBoxCurrentBank('start', 'My New Box')

    expect(store.getState().getCurrentBank().boxes.get(0)?.name).toBe('My New Box')

    assertIndicesMatchKeys(store.getState().getCurrentBank().boxes)
  })

  test('appending box to end', async () => {
    store.getState().addBoxCurrentBank('end', 'My New Box')

    const boxes = store.getState().getCurrentBank().boxes
    expect(boxes.get(boxes.size - 1)?.name).toBe('My New Box')

    assertIndicesMatchKeys(store.getState().getCurrentBank().boxes)
  })

  test('insert box before index', async () => {
    store.getState().addBoxCurrentBank(['before', 5], 'My New Box')

    const boxes = store.getState().getCurrentBank().boxes
    expect(boxes.get(5)?.name).toBe('My New Box')

    assertIndicesMatchKeys(store.getState().getCurrentBank().boxes)
  })

  test('insert box after index', async () => {
    store.getState().addBoxCurrentBank(['after', 5], 'My New Box')

    const boxes = store.getState().getCurrentBank().boxes
    expect(boxes.get(6)?.name).toBe('My New Box')

    assertIndicesMatchKeys(store.getState().getCurrentBank().boxes)
  })
})

describe('box deletion', () => {
  const store = buildTestStore()

  test('delete box', async () => {
    const thirdBoxId = store.getState().getCurrentBank().boxes.get(2)?.id
    assert(thirdBoxId !== undefined)

    store.getState().deleteBoxCurrentBank(thirdBoxId)

    expect(store.getState().getCurrentBank().boxes.get(2)?.id).not.toBe(thirdBoxId)

    assertIndicesMatchKeys(store.getState().getCurrentBank().boxes)
  })
})

function boxMapFromOrdered(boxesInOrder: SimpleOpenHomeBox[]): BoxMap {
  return new Map(boxesInOrder.map((box, index) => [index, { ...box, index }] as const))
}
