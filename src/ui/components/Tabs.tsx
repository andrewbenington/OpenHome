import {
  Tabs as BaseUiTabs,
  TabsIndicatorProps,
  TabsListProps,
  TabsPanelProps,
  TabsRootProps,
  TabsTabProps,
} from '@base-ui/react/tabs'
import './index.css'

export const Tabs = {
  Root: (props: TabsRootProps) => <BaseUiTabs.Root {...props} className="Tabs" />,
  List: (props: TabsListProps) => <BaseUiTabs.List {...props} className="List" />,
  IconList: (props: TabsListProps) => <BaseUiTabs.List {...props} className="List IconList" />,
  Tab: (props: TabsTabProps) => <BaseUiTabs.Tab {...props} className="Tab" />,
  Panel: (props: TabsPanelProps) => <BaseUiTabs.Panel {...props} className="Panel" />,
  Indicator: (props: TabsIndicatorProps) => (
    <BaseUiTabs.Indicator {...props} className="Indicator" />
  ),
}
