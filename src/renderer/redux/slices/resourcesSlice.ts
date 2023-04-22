import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { RootState } from '../store';

export const loadResourcesPath = createAsyncThunk(
  'resources/load',
  async () => {
    return await window.electron.ipcRenderer.invoke('get-resources-path');
  }
);

const initialState: { resourcesPath?: string } = {
  resourcesPath: undefined,
};

export const resoursesSlice = createSlice({
  name: 'recentSaves',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(loadResourcesPath.fulfilled, (state, action) => {
      state.resourcesPath = action.payload;
    });
  },
});

export const selectResourcesPath = (state: RootState) =>
  state.resources.resourcesPath;

export default resoursesSlice.reducer;
