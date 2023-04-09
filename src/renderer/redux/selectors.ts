import { OHPKM } from 'types/PKMTypes';
import { StringToStringMap, KeyValuePairList } from '../../types/types';
import { useAppDispatch, useAppSelector } from './hooks';
import {
  selectDragMon,
  selectDragSource,
  selectGen12Lookup,
  selectGen345Lookup,
  selectHomeData,
  selectHomeMons,
  selectModifiedOHPKMs,
  selectSaves,
  writeAllHomeData,
  writeAllSaveFiles,
} from './slices/appSlice';

export const useSaves = () => useAppSelector(selectSaves);
export const useHomeData = () => useAppSelector(selectHomeData);
export const useDragMon = () => useAppSelector(selectDragMon);
export const useDragSource = () => useAppSelector(selectDragSource);
export const useModifiedOHPKMs = () => useAppSelector(selectModifiedOHPKMs);
export const useSaveFunctions = (): [() => void, () => void] => {
  const dispatch = useAppDispatch();
  return [
    () => {
      console.log('writing save files');
      dispatch(writeAllSaveFiles());
    },
    () => {
      dispatch(writeAllHomeData());
    },
  ];
};

export const useLookupMaps = (): LookupMapsHook => [
  useAppSelector(selectHomeMons),
  useAppSelector(selectGen12Lookup),
  useAppSelector(selectGen345Lookup),
];

type LookupMapsHook = [
  { [key: string]: OHPKM } | undefined,
  StringToStringMap | undefined,
  StringToStringMap | undefined
];
