import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { OHPKM, PKM } from 'types/PKMTypes';
import { G1SAV, G2SAV, G3SAV, G4SAV, G5SAV, SAV } from 'types/SAVTypes';
import { HomeData } from 'types/SAVTypes/HomeData';
import { KeyValuePairList, SaveCoordinates } from 'types/types';
import {
  getMonFileIdentifier,
  getMonGen12Identifier,
  getMonGen345Identifier,
} from 'util/Lookup';
import { RootState } from '../store';

interface LookupState {
  gen12: { [key: string]: string };
  gen345: { [key: string]: string };
}

interface AppState {
  homeData: HomeData;
  saves: SAV[];
  dragSource?: SaveCoordinates;
  dragMon?: PKM;
  modifiedOHPKMs: OHPKM[];
  lookup: LookupState;
}

const initialState: AppState = {
  homeData: new HomeData(new Uint8Array()),
  saves: [],
  modifiedOHPKMs: [],
  lookup: {
    gen12: {},
    gen345: {},
  },
};

export const appSlice = createSlice({
  name: 'saves',
  initialState,
  reducers: {
    setSaveMon: (state, action: PayloadAction<SetSaveMonParams>) => {
      console.log('setSaveMon', action.payload);
      let mon = action.payload.mon;
      let replacedMon;
      const { box, index, saveNumber } = action.payload.saveCoordinates;
      if (saveNumber === -1) {
        if (!(mon instanceof OHPKM)) {
          mon = new OHPKM(mon);
        }
        replacedMon = state.homeData.boxes[box].pokemon[index];
        state.homeData.boxes[box].pokemon[index] = mon as OHPKM;
        state.homeData = { ...state.homeData };
      } else if (saveNumber < state.saves.length) {
        const tempSaves = [...state.saves];
        replacedMon = tempSaves[saveNumber].boxes[box].pokemon[index];
        tempSaves[saveNumber].boxes[box].pokemon[index] = mon;
        tempSaves[saveNumber].changedMons.push({ box, index });
        state.saves = tempSaves;
      }
      if (replacedMon && replacedMon instanceof OHPKM) {
        const identifier = getMonFileIdentifier(replacedMon);
        const modifiedListIndex = state.modifiedOHPKMs.findIndex((m) => {
          console.log(getMonFileIdentifier(m as OHPKM), identifier);
          return getMonFileIdentifier(m as OHPKM) === identifier;
        });
        if (modifiedListIndex > -1) {
          console.log('removing from modified OHPKMs');
          state.modifiedOHPKMs.splice(modifiedListIndex, 1);
        }
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
      const save = saveNumber === -1 ? state.homeData : state.saves[saveNumber];
      state.dragMon = save.boxes[box].pokemon[index];
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
        saveNumber: srcSaveNumber,
      } = state.dragSource;
      const srcIsHome = srcSaveNumber === -1;
      const {
        box: destBox,
        index: destIndex,
        saveNumber: destSaveNumber,
      } = action.payload;
      const destIsHome = destSaveNumber === -1;

      let mon = state.dragMon;
      if (srcSaveNumber != destSaveNumber) {
        mon = new OHPKM(mon);
        state.modifiedOHPKMs.push(mon as OHPKM);
      }

      const tempSaves = [...state.saves];
      const srcSave =
        srcSaveNumber === -1 ? state.homeData : tempSaves[srcSaveNumber];
      const destSave =
        destSaveNumber === -1 ? state.homeData : tempSaves[destSaveNumber];

      srcSave.boxes[srcBox].pokemon[srcIndex] = undefined;
      srcSave.changedMons.push({
        box: srcBox,
        index: srcIndex,
      });
      destSave.boxes[destBox].pokemon[destIndex] = mon;
      destSave.changedMons.push({
        box: destBox,
        index: destIndex,
      });
      state.dragMon = undefined;
      state.dragSource = undefined;
      if (!(srcIsHome && destIsHome)) {
        state.saves = tempSaves;
      } else if (srcIsHome || destIsHome) {
        state.homeData = { ...state.homeData };
      }
    },
    addSave: (state, action: PayloadAction<SAV>) => {
      state.saves.push(action.payload);
    },
    removeSaveAt: (state, action: PayloadAction<number>) => {
      state.saves.splice(action.payload, 1);
    },
    writeAllSaveFiles: (state) => {
      console.log('writing all save files');
      const tempSaves = [...state.saves];
      tempSaves.forEach((save) => {
        if (
          save instanceof G1SAV ||
          save instanceof G2SAV ||
          save instanceof G3SAV ||
          save instanceof G4SAV
        ) {
          const changedMons = save.prepareBoxesForSaving();
          if (changedMons && (save instanceof G2SAV || save instanceof G1SAV)) {
            changedMons.forEach((mon) => {
              const key = getMonFileIdentifier(mon);
              const value = getMonGen12Identifier(mon);
              if (key && value) {
                state.lookup.gen12[key] = value;
              }
            });
          } else if (
            changedMons &&
            (save instanceof G3SAV ||
              save instanceof G4SAV ||
              save instanceof G5SAV)
          ) {
            changedMons.forEach((mon) => {
              const key = getMonFileIdentifier(mon);
              const value = getMonGen345Identifier(mon);
              if (key && value) {
                state.lookup.gen345[key] = value;
              }
            });
          }
          window.electron.ipcRenderer.sendMessage('write-save-file', {
            path: save.filePath,
            bytes: save.bytes,
          });
        }
        console.log(state.lookup.gen345);
        window.electron.ipcRenderer.sendMessage(
          'write-gen12-lookup',
          state.lookup.gen12
        );
        window.electron.ipcRenderer.sendMessage(
          'write-gen345-lookup',
          state.lookup.gen345
        );
        save.changedMons = [];
      });
      state.saves = tempSaves;
    },
    clearAllSaves: (state) => {
      state.saves = [];
    },
    setHomeData: (state, action: PayloadAction<HomeData>) => {
      state.homeData = action.payload;
    },
    writeAllHomeData: (state) => {
      state.homeData.boxes.forEach((b) => {
        window.electron.ipcRenderer.sendMessage('write-home-box', {
          boxName: b.name,
          boxString: b.writeMonsToString(),
        });
      });
      state.modifiedOHPKMs.forEach((mon) => {
        console.log('writing', mon);
        if (mon) {
          window.electron.ipcRenderer.sendMessage('write-ohpkm', mon.bytes);
        }
      });
      state.modifiedOHPKMs = [];
    },
    setGen12Lookup: (
      state,
      action: PayloadAction<{ [key: string]: string }>
    ) => {
      state.lookup.gen12 = action.payload;
    },
    updateGen12Lookup: (
      state,
      action: PayloadAction<{ key: string; value: string }[]>
    ) => {
      action.payload.forEach(({ key, value }) => {
        state.lookup.gen12[key] = value;
      });
    },
    setGen345Lookup: (
      state,
      action: PayloadAction<{ [key: string]: string }>
    ) => {
      state.lookup.gen345 = action.payload;
    },
    updateGen345Lookup: (
      state,
      action: PayloadAction<{ key: string; value: string }[]>
    ) => {
      action.payload.forEach(({ key, value }) => {
        state.lookup.gen345[key] = value;
      });
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
  writeAllSaveFiles,
  setHomeData,
  writeAllHomeData,
  clearAllSaves,
  setGen12Lookup,
  updateGen12Lookup,
  setGen345Lookup,
  updateGen345Lookup,
} = appSlice.actions;

export const selectSaves = (state: RootState) => state.app.saves;
export const selectHomeData = (state: RootState) => state.app.homeData;
export const selectDragSource = (state: RootState) => state.app.dragSource;
export const selectDragMon = (state: RootState) => state.app.dragMon;
export const selectModifiedOHPKMs = (state: RootState) =>
  state.app.modifiedOHPKMs;
export const selectGen12Lookup = (state: RootState) => state.app.lookup.gen12;
export const selectGen345Lookup = (state: RootState) => state.app.lookup.gen345;

export const selectCount = (state: RootState) => state.app.saves.length;

export interface SetSaveMonParams {
  mon: PKM | undefined;
  saveCoordinates: SaveCoordinates;
}

export interface SetSaveBoxParams {
  saveNumber: number;
  box: number;
}

export default appSlice.reducer;
