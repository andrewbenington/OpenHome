export class LRUCache<K, V> {
  private map = new Map<K, V>()

  constructor(private capacity: number) {}

  get(key: K): V | undefined {
    const value = this.map.get(key)

    if (value) {
      this.map.delete(key)
      this.map.set(key, value) // move to most-recently-used end
    } else {
      console.log(`cache miss: ${key}`)
    }

    return value
  }

  peek(key: K): V | undefined {
    return this.map.get(key) // read without affecting order
  }

  set(key: K, value: V): K | undefined {
    let evicted: K | undefined
    if (this.map.has(key)) {
      this.map.delete(key)
    } else if (this.map.size >= this.capacity) {
      evicted = this.map.keys().next().value // oldest = first in iteration order
      if (evicted) this.map.delete(evicted)
    }
    this.map.set(key, value)
    return evicted
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
}
