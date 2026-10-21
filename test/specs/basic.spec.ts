import { browser, expect } from '@wdio/globals'
import '@wdio/tauri-service' // adds the browser.tauri typings
import { ChainablePromiseElement } from 'webdriverio'

function OpenHomeUi() {
  return {
    async find(selector: string): Promise<ChainablePromiseElement> {
      const element = browser.$(selector)
      await element.waitForDisplayed()
      return element
    },

    async findAndClick(selector: string, expectedText?: string): Promise<ChainablePromiseElement> {
      const element = await this.find(selector)
      await element.click()

      if (expectedText) {
        await expect(element).toHaveText(expectedText)
      }
      return element
    },
  }
}
describe('My Tauri App', () => {
  it('should display a Pokémon in a save and switch to the stats tab successfully', async () => {
    const ui = OpenHomeUi()
    await ui.findAndClick('#open-save-button', 'Open Save')

    await ui.findAndClick('.save-card')
    await ui.findAndClick('.draggable-mon')
    await ui.findAndClick('button=Stats')

    const hpHeader = await ui.find('th=HP')
    await expect(hpHeader).toHaveText('HP')
  })

  it('should mock Tauri commands', async () => {
    // Mock a Tauri command
    const mock = await browser.tauri.mock('get_state')
    await mock.mockReturnValue({ id: 1, name: 'Test User' })

    // Execute code that uses the mocked command
    const user = await browser.tauri.execute(({ core }) => {
      return core.invoke('get_state')
    })

    expect(user).toEqual({ id: 1, name: 'Test User' })
  })
})
