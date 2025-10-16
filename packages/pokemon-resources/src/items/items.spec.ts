import test from 'ava'

import { Item, ItemFromString, ItemToString } from './items'

test('ItemToString', (t) => {
    t.is(ItemToString(Item.AbilityShield), 'Ability Shield')
})

test('ItemFromString', (t) => {
    t.is(ItemFromString('Grepa Berry'), Item.GrepaBerry)
})
