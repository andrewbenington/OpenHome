import { useAppSelector } from './hooks';
import { selectSaves } from './slices/savesSlice';

export const useSaves = () => useAppSelector(selectSaves);
