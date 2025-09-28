export class Bag {
  private static items: Map<string, number> = new Map([
    ['Potion', 5],
    ['Ultra Ball', 3],
    ['Revive', 2],
  ])

  static addItem(itemName: string, count: number = 1): void {
    const currentCount = this.items.get(itemName) || 0

    this.items.set(itemName, currentCount + count)
  }

  static popItem(itemName: string): boolean {
    const currentCount = this.items.get(itemName)

    if (currentCount === undefined) {
      console.log(`Item "${itemName}" not found in the bag.`)
      return false
    }

    if (currentCount > 1) {
      this.items.set(itemName, currentCount - 1)
    } else {
      this.items.delete(itemName)
    }

    return true
  }

  static toJSON(): string {
    const itemObject = Object.fromEntries(this.items)

    return JSON.stringify(itemObject, null, 2) // Pretty printing with 2 spaces
  }

  static fromJSON(jsonString: string): void {
    const parsedData = JSON.parse(jsonString)

    this.items.clear()
    Object.entries(parsedData).forEach(([itemName, count]) => {
      if (typeof count === 'number') {
        this.items.set(itemName, count)
      }
    })
  }

  static displayItems(): void {
    console.log('Current items in bag:', Object.fromEntries(this.items))
  }

  static getItems(): { name: string; count: number }[] {
    return Array.from(this.items.entries()).map(([name, count]) => ({ name, count }))
  }

  static clear(): void {
    this.items.clear()
  }
}
