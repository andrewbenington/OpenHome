import { config as base } from './wdio.conf'
export const config: WebdriverIO.Config = {
  ...base,
  specs: ['./specs/basic.spec.ts'],
}
