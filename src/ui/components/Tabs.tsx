import {
  Tabs as BaseUiTabs,
  TabsIndicatorProps,
  TabsListProps,
  TabsPanelProps,
  TabsRootProps,
  TabsTabProps,
} from '@base-ui/react/tabs'
import { cssClass } from '@openhome-ui/util/style'
import { CSSProperties } from 'react'
import './Tabs.css'

type FlexDirection = {
  direction?: CSSProperties['flexDirection']
}

type PropsExtension = {
  className?: string
}

export const Tabs = {
  Root: (props: TabsRootProps & PropsExtension) => (
    <BaseUiTabs.Root {...props} className={cssClass('Tabs').with(props.className).build()} />
  ),
  List: (props: TabsListProps & FlexDirection & PropsExtension) => {
    return (
      <BaseUiTabs.List
        {...props}
        style={{ ...props.style, flexDirection: props.direction }}
        className={cssClass('List').with(props.className).build()}
      />
    )
  },
  IconList: (props: TabsListProps & FlexDirection & PropsExtension) => (
    <BaseUiTabs.List
      {...props}
      style={{ ...props.style, flexDirection: props.direction }}
      className={cssClass('List').with('IconList').with(props.className).build()}
    />
  ),
  Tab: (props: TabsTabProps) => <BaseUiTabs.Tab {...props} className="Tab" />,
  Panel: (props: TabsPanelProps) => <BaseUiTabs.Panel {...props} className="Panel" />,
  Indicator: (props: TabsIndicatorProps) => (
    <BaseUiTabs.Indicator {...props} className="Indicator" />
  ),
}
