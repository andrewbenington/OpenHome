import {
  createAsyncThunk,
  createSlice,
  current,
  Draft,
  PayloadAction,
} from '@reduxjs/toolkit';
import { OHPKM, PKM } from 'types/PKMTypes';
import { G1SAV, G2SAV, G3SAV, G4SAV, G5SAV, SAV } from 'types/SAVTypes';
import { HomeData } from 'types/SAVTypes/HomeData';
import { SaveCoordinates } from 'types/types';
import {
  getMonFileIdentifier,
  getMonGen12Identifier,
  getMonGen345Identifier,
} from 'util/Lookup';
import { AppState, RootState } from '../state';

export interface ImportMonsParams {
  mons: PKM[];
  saveCoordinates: SaveCoordinates;
}

export interface SetSaveBoxParams {
  saveNumber: number;
  box: number;
}

const initialState: AppState = {
  homeData: new HomeData(),
  saves: [],
  modifiedOHPKMs: {},
  monsToDelete: [],
  lookup: {},
};

export const loadHomeBoxes = createAsyncThunk('app/loadHomeBoxes', async () => {
  return window.electron.ipcRenderer.invoke('read-home-boxes', 'Box 1');
});

export const loadHomeMons = createAsyncThunk('app/loadHomeMons', async () => {
  return window.electron.ipcRenderer.invoke('read-home-mons');
});

export const loadGen12Lookup = createAsyncThunk(
  'app/loadGen12Lookup',
  async () => {
    return window.electron.ipcRenderer.invoke('read-gen12-lookup');
  }
);

export const loadGen345Lookup = createAsyncThunk(
  'app/loadGen345Lookup',
  async () => {
    return window.electron.ipcRenderer.invoke('read-gen345-lookup');
  }
);

const updateMonInSave = (
  state: Draft<AppState>,
  mon: PKM | undefined,
  saveCoordinates: SaveCoordinates
) => {
  let replacedMon;
  const { box, index, saveNumber } = saveCoordinates;
  if (saveNumber === -1 && (!mon || mon instanceof OHPKM)) {
    replacedMon = state.homeData.boxes[box].pokemon[index];
    state.homeData.boxes[box].pokemon[index] = mon;
    state.homeData = { ...state.homeData };
  } else if (saveNumber < state.saves.length) {
    const tempSaves = [...state.saves];
    replacedMon = tempSaves[saveNumber].boxes[box].pokemon[index];
    tempSaves[saveNumber].boxes[box].pokemon[index] = mon;
    tempSaves[saveNumber].updatedBoxSlots.push({ box, index });
    state.saves = tempSaves;
  }
  return replacedMon;
};

const markMonAsModified = (state: Draft<AppState>, mon: OHPKM) => {
  const identifier = getMonFileIdentifier(mon);
  if (identifier) {
    state.modifiedOHPKMs[identifier] = mon;
  }
};

export const appSlice = createSlice({
  name: 'saves',
  initialState,
  reducers: {
    deleteMon: (state, action: PayloadAction<SaveCoordinates>) => {
      const replacedMon = updateMonInSave(state, undefined, action.payload);
      if (replacedMon && replacedMon instanceof OHPKM) {
        const identifier = getMonFileIdentifier(replacedMon);
        if (identifier) {
          delete state.modifiedOHPKMs[identifier];
        }
        state.monsToDelete.push(replacedMon);
      }
    },
    importMons: (state, action: PayloadAction<ImportMonsParams>) => {
      const addedMons: OHPKM[] = [];
      const { mons, saveCoordinates } = action.payload;
      let nextIndex = saveCoordinates.index;
      const isHome = saveCoordinates.saveNumber === -1;
      const tempSave = isHome
        ? state.homeData
        : state.saves[saveCoordinates.saveNumber];
      mons.forEach((mon) => {
        const homeMon = new OHPKM(mon);
        while (
          tempSave.boxes[saveCoordinates.box].pokemon[nextIndex] &&
          nextIndex < tempSave.boxRows * tempSave.boxColumns
        ) {
          nextIndex++;
        }
        if (nextIndex < tempSave.boxRows * tempSave.boxColumns) {
          updateMonInSave(state, homeMon, {
            ...saveCoordinates,
            index: nextIndex,
          });
          addedMons.push(homeMon);
          nextIndex++;
        }
      });
      if (isHome) {
        state.homeData = { ...tempSave } as HomeData;
      } else {
        state.saves[saveCoordinates.saveNumber] = tempSave;
      }
      addedMons.forEach((mon) => markMonAsModified(state, mon));
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
      const { box, index, saveNumber } = action.payload;
      if (state.saves.length <= saveNumber) {
        return;
      }
      const save = saveNumber === -1 ? state.homeData : state.saves[saveNumber];
      state.dragMon = save.boxes[box].pokemon[index];
      state.dragSource = action.payload;
    },
    cancelDrag: (state) => {
      state.dragMon = undefined;
      state.dragSource = undefined;
    },
    completeDrag: (state, action: PayloadAction<SaveCoordinates>) => {
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
      if (srcSaveNumber !== destSaveNumber) {
        mon = new OHPKM(mon);
        markMonAsModified(state, mon as OHPKM);
      }

      const tempSaves = [...state.saves];
      const srcSave =
        srcSaveNumber === -1 ? { ...state.homeData } : tempSaves[srcSaveNumber];
      const destSave =
        destSaveNumber === -1
          ? { ...state.homeData }
          : tempSaves[destSaveNumber];

      srcSave.boxes[srcBox].pokemon[srcIndex] = undefined;
      srcSave.updatedBoxSlots.push({
        box: srcBox,
        index: srcIndex,
      });
      destSave.boxes[destBox].pokemon[destIndex] = mon;
      destSave.updatedBoxSlots.push({
        box: destBox,
        index: destIndex,
      });
      state.dragMon = undefined;
      state.dragSource = undefined;
      if (!(srcIsHome && destIsHome)) {
        state.saves = tempSaves;
      } else if (srcIsHome) {
        state.homeData = srcSave as any;
      } else if (destIsHome) {
        state.homeData = destSave as any;
      }
    },
    addSave: (state, action: PayloadAction<SAV>) => {
      state.saves.push(action.payload);
    },
    removeSaveAt: (state, action: PayloadAction<number>) => {
      state.saves.splice(action.payload, 1);
    },
    writeAllSaveFiles: (state) => {
      console.info('writing all save files');
      const tempSaves = [...state.saves];
      tempSaves.forEach((save) => {
        if (
          save instanceof G1SAV ||
          save instanceof G2SAV ||
          save instanceof G3SAV ||
          save instanceof G4SAV ||
          save instanceof G5SAV
        ) {
          const changedMons = save.prepareBoxesForSaving();
          if (changedMons && (save instanceof G2SAV || save instanceof G1SAV)) {
            changedMons.forEach((mon) => {
              const key = getMonGen12Identifier(mon);
              const value = getMonFileIdentifier(mon);
              if (!state.lookup.gen12) {
                console.error('no gen12 map loaded. cancelling save');
                return;
              }
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
            if (!state.lookup.gen345) {
              console.error('no gen345 map loaded. cancelling save');
              return;
            }
            appSlice.caseReducers.writeGen345Lookup(state, {
              type: '',
              payload: changedMons,
            });
          }
        }
        window.electron.ipcRenderer.sendMessage('write-save-file', {
          path: save.filePath,
          bytes: save.bytes,
        });
        save.updatedBoxSlots = [];
      });
      state.saves = [...tempSaves];
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
      Object.values(state.modifiedOHPKMs).forEach((mon) => {
        if (mon) {
          window.electron.ipcRenderer.sendMessage('write-ohpkm', mon.bytes);
        }
      });
      state.modifiedOHPKMs = {};
      state.monsToDelete.forEach((mon) => {
        const gen345Identifier = getMonGen345Identifier(mon as OHPKM);
        if (
          state.lookup.gen345 &&
          gen345Identifier &&
          gen345Identifier in state.lookup.gen345
        ) {
          delete state.lookup.gen345[gen345Identifier];
          appSlice.caseReducers.writeGen345Lookup(state, {
            type: '',
            payload: [],
          });
        }
        const gen12Identifier = getMonGen12Identifier(mon as OHPKM);
        if (
          state.lookup.gen12 &&
          gen12Identifier &&
          gen12Identifier in state.lookup.gen12
        ) {
          delete state.lookup.gen12[gen12Identifier];
          appSlice.caseReducers.writeGen12Lookup(state, {
            type: '',
            payload: [],
          });
        }
      });
      state.monsToDelete = [];
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
        if (!state.lookup.gen12) {
          console.error(
            'attempted to save before gen12 map loaded. cancelling'
          );
          return;
        }
        state.lookup.gen12[key] = value;
      });
    },
    writeGen12Lookup: (state, action: PayloadAction<OHPKM[]>) => {
      const newLookupMap = state.lookup.gen12;
      const monsToAdd = action.payload;
      if (!newLookupMap) {
        console.error('attempted to save before gen12 map loaded. cancelling');
        return;
      }
      monsToAdd.forEach((mon) => {
        const key = getMonGen12Identifier(mon);
        const value = getMonFileIdentifier(mon);
        if (key && value) {
          newLookupMap[key] = value;
        }
      });
      window.electron.ipcRenderer.sendMessage(
        'write-gen12-lookup',
        current(newLookupMap)
      );
      state.lookup.gen12 = newLookupMap;
    },
    setGen345Lookup: (
      state,
      action: PayloadAction<{ [key: string]: string }>
    ) => {
      state.lookup.gen345 = action.payload;
    },
    writeGen345Lookup: (state, action: PayloadAction<OHPKM[]>) => {
      const newLookupMap = state.lookup.gen345;
      const monsToAdd = action.payload;
      if (!newLookupMap) {
        console.error('attempted to save before gen345 map loaded. cancelling');
        return;
      }
      monsToAdd.forEach((mon) => {
        const key = getMonGen345Identifier(mon);
        const value = getMonFileIdentifier(mon);
        if (key && value) {
          newLookupMap[key] = value;
        }
      });
      window.electron.ipcRenderer.sendMessage(
        'write-gen345-lookup',
        current(newLookupMap)
      );
      state.lookup.gen345 = newLookupMap;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(loadHomeMons.fulfilled, (state, action) => {
      const homeMons: { [key: string]: OHPKM } = {};
      Object.entries(action.payload).forEach(([id, bytes]) => {
        homeMons[id] = new OHPKM(bytes);
      });
      return {
        ...state,
        lookup: { ...state.lookup, homeMons },
      };
    });
    builder.addCase(loadGen12Lookup.fulfilled, (state, action) => {
      return { ...state, lookup: { ...state.lookup, gen12: action.payload } };
    });
    builder.addCase(loadGen345Lookup.fulfilled, (state, action) => {
      return { ...state, lookup: { ...state.lookup, gen345: action.payload } };
    });
    builder.addCase(loadHomeBoxes.fulfilled, (state, action) => {
      const homeMonMap = state.lookup.homeMons;
      if (homeMonMap) {
        const newHomeData = new HomeData();
        Object.entries(action.payload).forEach(([, boxString], i) => {
          newHomeData.boxes[i].getMonsFromString(
            boxString as string,
            homeMonMap as { [key: string]: OHPKM }
          );
        });
        return { ...state, homeData: newHomeData };
      }
      console.error('box loaded before home lookup map');
      return state;
    });
  },
});

export const {
  deleteMon,
  importMons,
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
  writeGen345Lookup,
} = appSlice.actions;

export const selectSaves = (state: RootState) => state.app.saves;
export const selectHomeData = (state: RootState) => state.app.homeData;
export const selectHomeMons = (state: RootState) => state.app.lookup.homeMons;
export const selectDragSource = (state: RootState) => state.app.dragSource;
export const selectDragMon = (state: RootState) => state.app.dragMon;
export const selectModifiedOHPKMs = (state: RootState) =>
  state.app.modifiedOHPKMs;
export const selectGen12Lookup = (state: RootState) => state.app.lookup.gen12;
export const selectGen345Lookup = (state: RootState) => state.app.lookup.gen345;
export const selectMonsToDelete = (state: RootState) => state.app.monsToDelete;

export const selectCount = (state: RootState) => state.app.saves.length;

export default appSlice.reducer;
