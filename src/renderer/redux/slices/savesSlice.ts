import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { GameOfOrigin } from 'consts';
import { OHPKM, PKM } from 'types/PKMTypes';
import { SAV } from 'types/SAVTypes';
import { SaveCoordinates } from 'types/types';
import { RootState } from '../store';

interface SavesState {
  saves: SAV[];
  dragSource?: SaveCoordinates;
  dragMon?: PKM;
}

const initialState: SavesState = {
  saves: [],
};

export const savesSlice = createSlice({
  name: 'saves',
  initialState,
  reducers: {
    setSaveMon: (state, action: PayloadAction<SetSaveMonParams>) => {
      const mon = action.payload.mon;
      const { box, index, saveNumber } = action.payload.saveCoordinates;
      const tempSaves = [...state.saves];
      const changingSave = state.saves[saveNumber];
      if (changingSave) {
        tempSaves[saveNumber].boxes[box].pokemon[index] = mon;
        state.saves = tempSaves;
      }
    },
    setSaveBox: (state, action: PayloadAction<SetSaveBoxParams>) => {
      const { box, saveNumber } = action.payload;
      const tempSaves = [...state.saves];
      const changingSave = state.saves[saveNumber];
      if (changingSave) {
        tempSaves[saveNumber].currentPCBox = box;
        state.saves = tempSaves;
      }
    },
    startDrag: (state, action: PayloadAction<SaveCoordinates>) => {
      console.log('start drag', action.payload);
      const { box, index, saveNumber } = action.payload;
      if (state.saves.length <= saveNumber) {
        return;
      }
      state.dragMon = state.saves[saveNumber].boxes[box].pokemon[index];
      state.dragSource = action.payload;
    },
    cancelDrag: (state) => {
      console.log('cancel drag');
      state.dragMon = undefined;
      state.dragSource = undefined;
    },
    completeDrag: (state, action: PayloadAction<SaveCoordinates>) => {
      console.log('complete drag', action);
      if (!state.dragSource) {
        state.dragMon = undefined;
        state.dragSource = undefined;
        return;
      }
      const {
        box: srcBox,
        index: srcIndex,
        saveNumber: srcSave,
      } = state.dragSource;
      const {
        box: destBox,
        index: destIndex,
        saveNumber: destSave,
      } = action.payload;

      let mon = state.dragMon;
      if (srcSave != destSave) {
        mon = new OHPKM(mon);
      }
      const tempSaves = [...state.saves];
      tempSaves[srcSave].boxes[srcBox].pokemon[srcIndex] = undefined;
      tempSaves[srcSave].changedMons.push({ box: srcBox, index: srcIndex });
      tempSaves[destSave].boxes[destBox].pokemon[destIndex] = mon;
      tempSaves[destSave].changedMons.push({ box: destBox, index: destIndex });
      state.dragMon = undefined;
      state.dragSource = undefined;
      state.saves = tempSaves;
    },
    addSave: (state, action: PayloadAction<SAV>) => {
      state.saves.push(action.payload);
    },
    removeSaveAt: (state, action: PayloadAction<number>) => {
      state.saves.splice(action.payload, 1);
    },
    clearAllSaves: (state) => {
      state.saves = [];
    },
  },
});

export const {
  setSaveMon,
  setSaveBox,
  startDrag,
  cancelDrag,
  completeDrag,
  addSave,
  removeSaveAt,
  clearAllSaves,
} = savesSlice.actions;

export const selectSaves = (state: RootState) => state.saves.saves;

export const selectCount = (state: RootState) => state.saves.saves.length;

export interface SetSaveMonParams {
  mon: PKM;
  saveCoordinates: SaveCoordinates;
}

export interface SetSaveBoxParams {
  saveNumber: number;
  box: number;
}

export default savesSlice.reducer;
