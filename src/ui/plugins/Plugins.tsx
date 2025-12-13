import { AppInfoContext } from '@openhome/ui/state/appInfo'
import { useContext, useEffect } from 'react'
import { BackendContext } from 'src/ui/backend/backendContext'
import SideTabs from 'src/ui/components/side-tabs/SideTabs'
import BrowsePlugins from './BrowsePlugins'
import InstalledPlugins from './InstalledPlugins'
import './style.css'

export const CURRENT_PLUGIN_API_VERSION = 2

export default function PluginsPage() {
  const [{ settings }] = useContext(AppInfoContext)
  const backend = useContext(BackendContext)

  useEffect(() => {
    backend.updateSettings(settings).catch(console.error)
  }, [settings, backend])

  return (
    <SideTabs.Root defaultValue="browse">
      <SideTabs.TabList>
        <SideTabs.Tab value="browse">Browse Plugins</SideTabs.Tab>
        <SideTabs.Tab value="installed">Installed Plugins</SideTabs.Tab>
      </SideTabs.TabList>
      <SideTabs.Panel value="browse">
        <BrowsePlugins />
      </SideTabs.Panel>
      <SideTabs.Panel value="installed">
        <InstalledPlugins />
      </SideTabs.Panel>
    </SideTabs.Root>
  )
}
