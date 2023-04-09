import { HomeData } from 'types/SAVTypes/HomeData';
import { useAppDispatch } from './hooks';
import { setHomeData } from './slices/appSlice';

export function dispatchSetHomeData(data: HomeData) {
  const dispatch = useAppDispatch();
  return dispatch(setHomeData(data));
}
