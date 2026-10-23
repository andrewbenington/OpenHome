import { SAV, saveToStringIdentifier } from '@openhome-core/save/interfaces'
import { browser, expect } from '@wdio/globals'
import '@wdio/tauri-service' // adds the browser.tauri typings
import { ChainablePromiseElement } from 'webdriverio'

export type FindOptions = { expectedText?: string }

const OpenHomeUi = {
  async find(selector: string, options?: FindOptions): Promise<WebdriverIO.Element> {
    return (await this.findChainable(selector, options)).getElement()
  },

  async findChainable(selector: string, options?: FindOptions): Promise<ChainablePromiseElement> {
    const element = browser.$(selector)
    await element.waitForDisplayed()

    if (options?.expectedText) {
      await expect(element).toHaveText(options.expectedText)
    }

    return element
  },

  async findHomeSlot(box: number, slot: number): Promise<WebdriverIO.Element> {
    return (await this.find(`#home_${box}_${slot}`)).getElement()
  },

  async homeMonElement(box: number, slot: number): Promise<WebdriverIO.Element> {
    return await (await this.findHomeSlot(box, slot)).$('.draggable-mon').getElement()
  },

  async findSaveSlot(save: SAV, box: number, slot: number): Promise<WebdriverIO.Element> {
    return (await this.find(`[id="${saveToStringIdentifier(save)}_${box}_${slot}"]`)).getElement()
  },

  async saveMonElement(save: SAV, box: number, slot: number): Promise<WebdriverIO.Element> {
    return (await this.findSaveSlot(save, box, slot)).getElement()
  },

  async findAndClick(selector: string, options?: FindOptions): Promise<WebdriverIO.Element> {
    const element = await this.find(selector, options)
    await element.click()

    return element
  },

  async getFileTypeSelectValue() {
    return (await this.find('.file-type-select')).getValue()
  },

  async findAndRightClick(selector: string, options?: FindOptions) {
    const element = await this.find(selector, options)
    await browser.execute((el: HTMLElement) => {
      const { x, y } = el.getBoundingClientRect()
      el.dispatchEvent(
        new MouseEvent('contextmenu', {
          bubbles: true,
          cancelable: true,
          view: window,
          button: 2,
          buttons: 2,
          clientX: x,
          clientY: y,
        })
      )
    }, element)
  },

  async dragAndDrop(source: WebdriverIO.Element, target: WebdriverIO.Element) {
    const from = await getCenter(source)
    const to = await getCenter(target)

    await dispatchPointer(source, 'pointerdown', from.x, from.y)

    const steps = 10
    for (let i = 1; i <= steps; i++) {
      await dispatchPointer(
        source,
        'pointermove',
        from.x + ((to.x - from.x) * i) / steps,
        from.y + ((to.y - from.y) * i) / steps
      )
      await browser.pause(20)
    }

    await dispatchPointer(target, 'pointerup', to.x, to.y)
  },

  async openAnySave() {
    await this.findAndClick('#open-save-button', { expectedText: 'Open Save' })

    await this.findAndClick('.save-card')
  },
}

export async function getCenter(el: WebdriverIO.Element): Promise<{ x: number; y: number }> {
  return browser.execute((el: HTMLElement) => {
    const r = el.getBoundingClientRect()
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
  }, el as any)
}

export async function dispatchPointer(
  el: ChainablePromiseElement | WebdriverIO.Element,
  type: string,
  x: number,
  y: number
) {
  await browser.execute(
    (el: HTMLElement, type: string, x: number, y: number) => {
      const target =
        type === 'pointermove' ? (document.elementFromPoint(x, y) ?? document.body) : el
      target.dispatchEvent(
        new PointerEvent(type, {
          bubbles: true,
          cancelable: true,
          view: window,
          pointerId: 1,
          pointerType: 'mouse',
          isPrimary: true,
          button: type === 'pointermove' ? -1 : 0,
          buttons: type === 'pointerup' ? 0 : 1,
          clientX: x,
          clientY: y,
        })
      )
    },
    el,
    type,
    x,
    y
  )
}

export default OpenHomeUi
