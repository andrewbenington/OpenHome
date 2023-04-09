import { OHPKM } from 'types/PKMTypes';
import { SAV } from 'types/SAVTypes';
import { SaveRefMap, StringToStringMap } from '../../types/types';
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
import {
  removeRecentSave,
  selectRecentSaves,
  upsertRecentSave,
} from './slices/recentSavesSlice';
import { selectResourcesPath } from './slices/resourcesSlice';

export const useSaves = () => useAppSelector(selectSaves);
export const useHomeData = () => useAppSelector(selectHomeData);
export const useDragMon = () => useAppSelector(selectDragMon);
export const useDragSource = () => useAppSelector(selectDragSource);
export const useModifiedOHPKMs = () => useAppSelector(selectModifiedOHPKMs);
export const useSaveFunctions = (): [() => void, () => void] => {
  const dispatch = useAppDispatch();
  return [
    () => dispatch(writeAllSaveFiles()),
    () => dispatch(writeAllHomeData()),
  ];
};
export const useRecentSaves = (): [
  SaveRefMap,
  (save: SAV) => void,
  (filePath: string) => void
] => {
  const dispatch = useAppDispatch();
  return [
    useAppSelector(selectRecentSaves),
    (save) => dispatch(upsertRecentSave(save)),
    (filePath) => dispatch(removeRecentSave(filePath)),
  ];
};

export const useLookupMaps = (): LookupMapsHook => [
  useAppSelector(selectHomeMons),
  useAppSelector(selectGen12Lookup),
  useAppSelector(selectGen345Lookup),
];

export const useResourcesPath = () => useAppSelector(selectResourcesPath);

type LookupMapsHook = [
  { [key: string]: OHPKM } | undefined,
  StringToStringMap | undefined,
  StringToStringMap | undefined
];
