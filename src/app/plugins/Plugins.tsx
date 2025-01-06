import { useContext, useEffect } from 'react'
import { BackendContext } from 'src/backend/backendContext'
import { AppInfoContext } from 'src/state/appInfo'
import SideTabs from '../../components/side-tabs/SideTabs'
import BrowsePlugins from './BrowsePlugins'
import InstalledPlugins from './InstalledPlugins'
import './style.css'

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
