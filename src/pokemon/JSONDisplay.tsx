<<<<<<< HEAD
import { Box, useTheme } from '@mui/joy'
import { JSONTree } from 'react-json-tree'
import { PKMInterface } from '../../types/interfaces'

interface JSONDisplayProps {
  mon: PKMInterface
}

export default function JSONDisplay(props: JSONDisplayProps) {
  const { mon } = props
  const theme = useTheme()

  const jsonTheme = {
    base00: '#0000',
    base01: '#383830',
    base02: '#49483e',
    base03: theme.palette.background.surface, // number of keys
    base04: '#a59f85',
    base05: '#f8f8f2',
    base06: '#f5f4f1',
    base07: '#f9f8f5',
    base08: theme.palette.warning.mainChannel, // null/undefined
    base09: theme.palette.primary.mainChannel, // true/false/numbers
    base0A: '#f4bf75',
    base0B: theme.palette.text.primary, // strings
    base0C: '#a1efe4',
    base0D: '#ffffff', // keys
    base0E: '#ae81ff',
    base0F: '#cc6633',
  }

  return (
    <Box display="flex" flexDirection="column" width="calc(100% - 16px)" marginLeft={2}>
      <JSONTree theme={jsonTheme} data={mon} />
    </Box>
  )
=======
import { Box, useTheme } from "@mui/joy";
import { JSONTree } from "react-json-tree";
import { PKMInterface } from "../types/interfaces";

interface JSONDisplayProps {
  mon: PKMInterface;
}

export default function JSONDisplay(props: JSONDisplayProps) {
  const { mon } = props;
  const theme = useTheme();

  const jsonTheme = {
    base00: "#0000",
    base01: "#383830",
    base02: "#49483e",
    base03: theme.palette.background.surface, // number of keys
    base04: "#a59f85",
    base05: "#f8f8f2",
    base06: "#f5f4f1",
    base07: "#f9f8f5",
    base08: theme.palette.warning.mainChannel, // null/undefined
    base09: theme.palette.primary.mainChannel, // true/false/numbers
    base0A: "#f4bf75",
    base0B: theme.palette.text.primary, // strings
    base0C: "#a1efe4",
    base0D: "#ffffff", // keys
    base0E: "#ae81ff",
    base0F: "#cc6633",
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      width="calc(100% - 16px)"
      marginLeft={2}
    >
      <JSONTree theme={jsonTheme} data={mon} />
    </Box>
  );
>>>>>>> tauri
}
