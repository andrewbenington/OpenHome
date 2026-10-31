import { Flex, type FlexProps } from '@radix-ui/themes'
import './OhoFlex.css'

type OhoFlexProps = {} & FlexProps

function RowStart(props: OhoFlexProps) {
  return <Flex direction="row" align="center" justify="start" gap="2" {...props} />
}

function RowFullHeight(props: OhoFlexProps) {
  return <Flex direction="row" gap="2" height="100%" {...props} />
}

function RowCentered(props: OhoFlexProps) {
  return <Flex direction="row" align="center" justify="center" gap="2" {...props} />
}

function Row(props: OhoFlexProps) {
  return <Flex direction="row" align="center" gap="2" {...props} />
}

function RowEqualSized(props: OhoFlexProps) {
  return <Flex className="flex-equal-size" direction="row" align="center" gap="2" {...props} />
}

function RowEnd(props: OhoFlexProps) {
  return <Flex direction="row" align="center" justify="end" gap="2" width="100%" {...props} />
}

function ColStart(props: OhoFlexProps) {
  return <Flex direction="column" align="start" gap="1" {...props} />
}

function ColCentered(props: OhoFlexProps) {
  return <Flex direction="column" align="center" gap="1" {...props} />
}

function ColFullHeight(props: OhoFlexProps) {
  return <Flex direction="column" height="100%" gap="2" {...props} />
}

function ColFullWidth(props: OhoFlexProps) {
  return <Flex direction="column" width="100%" gap="2" {...props} />
}

function Spacer() {
  return <div style={{ flex: 1, width: 0 }} />
}

const OhoFlex = {
  RowCentered,
  RowStart,
  RowFullHeight,
  Row,
  RowEnd,
  RowEqualSized,
  ColStart,
  ColCentered,
  ColFullHeight,
  ColFullWidth,
  Spacer,
}

export default OhoFlex
