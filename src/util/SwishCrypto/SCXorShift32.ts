export class SCXorShift32 {
  counter: number = 0
  state: number

  constructor(seed: number) {
    this.state = SCXorShift32.getInitialState(seed)
  }

  private static getInitialState(state: number) {
    const bitCount = count1BitsU32(state)
    // console.log(`bitCount: ${bitCount}`)
    for (let i = 0; i < bitCount; i++) {
      state = XorshiftAdvance(state)
    }
    // console.log(`state: ${state}`)
    return state
  }

  public Next() {
    // console.log(
    //   `c << 3: ${this.counter << 3}; State >> (c << 3): ${this.state >>> (this.counter << 3)}; State: ${this.state}`
    // )
    const result = (this.state >>> (this.counter << 3)) & 0xff
    if (this.counter == 3) {
      this.state = XorshiftAdvance(this.state)
      this.counter = 0
    } else {
      this.counter++
    }
    return result
  }

  public Next32() {
    return this.Next() | (this.Next() << 8) | (this.Next() << 16) | (this.Next() << 24)
  }
}

function XorshiftAdvance(state: number) {
  state = state >>> 0
  state ^= (state & 0xffffffff) << 2
  state ^= (state & 0xffffffff) >>> 15
  state ^= (state & 0xffffffff) << 13
  return state
}

function count1BitsU32(value: number) {
  let uint = (value >>> 0) & 0xffffffff

  let count = 0
  while (uint !== 0) {
    count += uint & 1
    uint = uint >>> 1
  }
  return count
}
