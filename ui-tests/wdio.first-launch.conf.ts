import { config as base } from './wdio.conf'
export const config: WebdriverIO.Config = {
  ...base,
  specs: ['./specs/first-launch.spec.ts'],
}
