import { StringIndexableMap, KeyValuePairList } from '../../types/types';
import { useAppDispatch, useAppSelector } from './hooks';
import {
  selectDragMon,
  selectDragSource,
  selectGen12Lookup,
  selectGen345Lookup,
  selectHomeData,
  selectModifiedOHPKMs,
  selectSaves,
  setGen12Lookup,
  setGen345Lookup,
  updateGen12Lookup,
  updateGen345Lookup,
  writeAllHomeData,
  writeAllSaveFiles,
} from './slices/appSlice';

export const useSaves = () => useAppSelector(selectSaves);
export const useHomeData = () => useAppSelector(selectHomeData);
export const useDragMon = () => useAppSelector(selectDragMon);
export const useDragSource = () => useAppSelector(selectDragSource);
export const useModifiedOHPKMs = () => useAppSelector(selectModifiedOHPKMs);
export const useGen12Lookup = (): LookupMapHook => {
  const dispatch = useAppDispatch();
  return [
    useAppSelector(selectGen12Lookup),
    (map) => dispatch(setGen12Lookup(map)),
    (updates) => dispatch(updateGen12Lookup(updates)),
  ];
};
export const useGen345Lookup = (): LookupMapHook => {
  const dispatch = useAppDispatch();
  return [
    useAppSelector(selectGen345Lookup),
    (map) => dispatch(setGen345Lookup(map)),
    (updates) => dispatch(updateGen345Lookup(updates)),
  ];
};
export const useSaveFunctions = (): [() => void, () => void] => {
  const dispatch = useAppDispatch();
  return [
    () => {
      console.log('writing save files');
      dispatch(writeAllSaveFiles());
    },
    () => dispatch(writeAllHomeData()),
  ];
};

export const useLookupMaps = () => [
  useAppSelector(selectGen12Lookup),
  useAppSelector(selectGen345Lookup),
];

type LookupMapHook = [
  StringIndexableMap,
  (map: StringIndexableMap) => void,
  (updates: KeyValuePairList) => void
];
