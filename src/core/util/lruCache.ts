import dayjs, { Dayjs } from 'dayjs'
import { Option } from './functional'

export type CacheEntry<V> = {
  data: V
  timestamp: Dayjs
}

function timestamped<V>(data: V): CacheEntry<V> {
  return {
    data,
    timestamp: dayjs(),
  }
}

export class LRUCache<K, V> {
  private map = new Map<K, CacheEntry<V>>()

  constructor(private capacity: number) {}

  get(key: K): V | undefined {
    const value = this.map.get(key)

    if (value) {
      this.map.delete(key)
      this.map.set(key, value) // move to most-recently-used end
    }

    return value?.data
  }

  getWithTimestamp(key: K): Option<CacheEntry<V>> {
    const value = this.map.get(key)

    if (value) {
      this.map.delete(key)
      this.map.set(key, value) // move to most-recently-used end
    }

    return value
  }

  peek(key: K): V | undefined {
    return this.map.get(key)?.data // peek doesn't affect order
  }

  insert(key: K, value: V) {
    let evicted: K | undefined
    if (this.map.has(key)) {
      this.map.delete(key)
    } else if (this.map.size >= this.capacity) {
      evicted = this.map.keys().next().value // oldest = first in iteration order
      if (evicted) this.map.delete(evicted)
    }
    this.map.set(key, timestamped(value))
  }

  delete(key: K): boolean {
    return this.map.delete(key)
  }

  has(key: K): boolean {
    return this.map.has(key)
  }

  get size() {
    return this.map.size
  }

  keys() {
    return this.map.keys() // oldest -> newest
  }

  reset() {
    this.map = new Map()
  }
}
