import { Tab, tabClasses, TabList, TabPanel, Tabs } from '@mui/joy'
import { useContext, useEffect } from 'react'
import { BackendContext } from 'src/backend/backendContext'
import { AppInfoContext } from 'src/state/appInfo'
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
    <Tabs defaultValue="browse" orientation="vertical" style={{ height: '100%' }}>
      <TabList
        variant="solid"
        color="primary"
        sx={{
          whiteSpace: 'nowrap',
          p: 0.8,
          gap: 0.5,
          [`& .${tabClasses.root}`]: {
            borderRadius: 'lg',
          },
          [`& .${tabClasses.root}[aria-selected="true"]`]: {
            boxShadow: 'sm',
          },
        }}
      >
        <Tab disableIndicator value="browse" variant="solid" color="primary">
          Browse Plugins
        </Tab>
        <Tab disableIndicator value="installed" variant="solid" color="primary">
          Installed Plugins
        </Tab>
      </TabList>
      <TabPanel value="browse">
        <BrowsePlugins />
      </TabPanel>
      <TabPanel value="installed">
        <InstalledPlugins />
      </TabPanel>
    </Tabs>
  )
}
