import { BackendContext } from '@openhome-ui/backend/backendContext'
import SideTabs from '@openhome-ui/components/side-tabs/SideTabs'
import { AppInfoContext } from '@openhome-ui/state/appInfo'
import { useContext, useEffect } from 'react'
import { Route, Routes } from 'react-router'
import { usePathSegment } from 'src/ui/hooks/routing'
import BrowsePlugins from './BrowsePlugins'
import InstalledPlugins from './InstalledPlugins'
import './style.css'

export const CURRENT_PLUGIN_API_VERSION = 3

export default function PluginsPage() {
  const { currentSegment, setCurrentSegment } = usePathSegment('plugins', 'installed')
  const [{ settings }] = useContext(AppInfoContext)
  const backend = useContext(BackendContext)

  useEffect(() => {
    backend.updateSettings(settings).catch(console.error)
  }, [settings, backend])

  const browsePluginsElement = <InstalledPlugins />

  return (
    <SideTabs.Root value={currentSegment} onValueChange={setCurrentSegment}>
      <SideTabs.TabList>
        <SideTabs.Tab value="installed">Installed Plugins</SideTabs.Tab>
        <SideTabs.Tab value="browse">Browse Plugins</SideTabs.Tab>
      </SideTabs.TabList>
      <Routes>
        <Route index path="/" element={browsePluginsElement} />
        <Route path="browse" element={<BrowsePlugins />} />
        <Route path="installed" element={<InstalledPlugins />} />
      </Routes>
    </SideTabs.Root>
  )
}
