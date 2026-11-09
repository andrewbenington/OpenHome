export const config: WebdriverIO.Config = {
  runner: 'local',
  specs: ['./ui-tests/specs/**/*.spec.ts'],
  maxInstances: 1,

  // Tauri
  services: [
    [
      '@wdio/tauri-service',
      {
        appBinaryPath: './target/release/OpenHomeUiTesting',
        driverProvider: 'embedded',
        autoInstallTauriDriver: true,
        autoDownloadEdgeDriver: true,
        captureBackendLogs: true,
        captureFrontendLogs: true,
      },
    ],
  ],

  // Capabilities
  capabilities: [
    {
      browserName: 'tauri',
      'tauri:options': {
        application: './target/release/OpenHomeUiTesting',
      },
    },
  ],

  // Logging
  logLevel: 'info',
  bail: 0,
  baseUrl: 'http://localhost:4444',
  waitforTimeout: 2000,
  connectionRetryTimeout: 90000,
  connectionRetryCount: 3,

  // Test configuration
  framework: 'mocha',
  mochaOpts: {
    ui: 'bdd',
    timeout: 60000,
  },
}

declare global {
  namespace WebdriverIO {
    interface Capabilities {
      'tauri:options'?: {
        application: string
        args?: string[]
        webviewOptions?: Record<string, unknown>
      }
    }
  }
}
