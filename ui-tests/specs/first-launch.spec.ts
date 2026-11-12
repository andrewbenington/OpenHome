import { initializeWasm } from '@openhome-core/pkm/__test__/init'
import { $, expect } from '@wdio/globals'
import '@wdio/tauri-service'

describe('Launching for the first time', () => {
  before(async () => {
    await initializeWasm()
  })

  it('should not display an error ribbon', async () => {
    await $('#app-container').waitForDisplayed()
    await expect($('.message-ribbon-error')).not.toExist({ wait: 0 }) // wait: 0 prevents retries if it finds the ribbon. any error ribbon should be an immediate failure
  })
})
