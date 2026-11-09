import {
  Tabs as BaseUiTabs,
  TabsIndicatorProps,
  TabsPanelProps,
  TabsRootProps,
  TabsTabProps,
} from '@base-ui/react/tabs'
import { cssClass } from '@openhome-ui/util/style'
import type * as React from 'react'
import './Tabs.css'

type FlexDirection = {
  direction?: React.CSSProperties['flexDirection']
}

type PropsExtension = {
  className?: string
  style?: React.CSSProperties
}

type CustomTabRootProps = Omit<TabsRootProps, 'style'> & PropsExtension

export const Tabs = {
  Root: (props: CustomTabRootProps) => (
    <BaseUiTabs.Root {...props} className={cssClass('Tabs').with(props.className).build()} />
  ),
  List: (props: CustomTabRootProps & FlexDirection) => {
    return (
      <BaseUiTabs.List
        {...props}
        style={{ ...props.style, flexDirection: props.direction }}
        className={cssClass('List').with(props.className).build()}
      />
    )
  },
  IconList: (props: CustomTabRootProps & FlexDirection) => (
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
