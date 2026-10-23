import { initializeWasm } from '@openhome-core/pkm/__test__/init'
import { G2SAV } from '@openhome-core/save/G2SAV'
import { saveToStringIdentifier } from '@openhome-core/save/interfaces'
import { emptyPathData } from '@openhome-core/save/util/path'
import { browser, expect } from '@wdio/globals'
import '@wdio/tauri-service' // adds the browser.tauri typings
import fs from 'node:fs'
import path from 'node:path'
import ui from './helpers'

function saveTestFilePath(...pathElements: string[]): string {
  return path.join(__dirname, '..', 'ui-tests-data-dir', 'test_saves', ...pathElements)
}

export let crystalSaveFile: G2SAV

describe('Accessing a save mon', () => {
  before(async () => {
    const saveBytes = fs.readFileSync(saveTestFilePath('crystal-shinies.sav'))
    await initializeWasm()
    crystalSaveFile = new G2SAV(emptyPathData, saveBytes)
  })

  afterEach(async () => {
    await browser.refresh()
  })

  it('should display a Pokémon in a save and switch to the stats tab successfully', async () => {
    await ui.findAndClick('#open-save-button', { expectedText: 'Open Save' })

    await ui.findAndClick('.save-card')
    await ui.findAndClick('.draggable-mon')
    await ui.findAndClick('button=Stats')

    const hpHeader = await ui.find('th=HP')
    await expect(hpHeader).toHaveText('HP')
  })

  it('should show mon context menu', async () => {
    await ui.openAnySave()

    await ui.findAndRightClick('.draggable-mon')
    await ui.find('.ContextMenuLabel', { expectedText: 'RATICATE' })
  })

  it('should drag a save mon into a Home box, which converts it to OHPKM', async () => {
    await ui.openAnySave()

    const monElement = await ui.find('.draggable-mon')
    const firstHomeSlot = await ui.findHomeSlot(0, 0)

    await ui.dragAndDrop(monElement, firstHomeSlot)

    const ohpkm = firstHomeSlot.$('.draggable-mon')
    await ohpkm.click()

    await expect(await ui.getFileTypeSelectValue()).toBe('OHPKM')
  })

  it('should drag a Home mon into a save box, where it continues being displayed as OHPKM', async () => {
    console.log(saveToStringIdentifier(crystalSaveFile))
    await ui.openAnySave()

    const homeMon = await ui.homeMonElement(0, 5)
    const saveSlot = await ui.findSaveSlot(crystalSaveFile, 0, 5)

    await ui.dragAndDrop(homeMon, saveSlot)
    const saveMon = await saveSlot.$('.draggable-mon').getElement()

    await saveMon.click()

    await expect(await ui.getFileTypeSelectValue()).toBe('OHPKM')
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
