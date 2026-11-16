import { useAppState } from '@openhome-ui/state/app-state'

export default function useIsDebug(): boolean {
  return useAppState().is_dev
}
