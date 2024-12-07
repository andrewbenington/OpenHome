<<<<<<< HEAD
import { Dispatch, Reducer, createContext } from 'react'
import { BW2SAV } from '../../types/SAVTypes/BW2SAV'
import { BWSAV } from '../../types/SAVTypes/BWSAV'
import { DPSAV } from '../../types/SAVTypes/DPSAV'
import { G1SAV } from '../../types/SAVTypes/G1SAV'
import { G2SAV } from '../../types/SAVTypes/G2SAV'
import { G3SAV } from '../../types/SAVTypes/G3SAV'
import { HGSSSAV } from '../../types/SAVTypes/HGSSSAV'
import { ORASSAV } from '../../types/SAVTypes/ORASSAV'
import { PtSAV } from '../../types/SAVTypes/PtSAV'
import { G3RRSAV } from '../../types/SAVTypes/radicalred/G3RRSAV'
import { SMSAV } from '../../types/SAVTypes/SMSAV'
import { USUMSAV } from '../../types/SAVTypes/USUMSAV'
import { SAVClass } from '../../types/SAVTypes/util'
import { XYSAV } from '../../types/SAVTypes/XYSAV'

export type Settings = {
  enabledSaveTypes: Record<string, boolean>
  officialSaveTypes: SAVClass[]
  extraSaveTypes: SAVClass[]
}

export type AppInfoState = {
  resourcesPath?: string
  settings: Settings
}

export type AppInfoAction =
  | {
      type: 'set_resources_path'
      payload: string
    }
  | {
      type: 'set_savetype_enabled'
      payload: {
        saveType: SAVClass
        enabled: boolean
      }
    }
=======
import { Dispatch, Reducer, createContext } from "react";
import { BW2SAV } from "../types/SAVTypes/BW2SAV";
import { BWSAV } from "../types/SAVTypes/BWSAV";
import { DPSAV } from "../types/SAVTypes/DPSAV";
import { G1SAV } from "../types/SAVTypes/G1SAV";
import { G2SAV } from "../types/SAVTypes/G2SAV";
import { G3SAV } from "../types/SAVTypes/G3SAV";
import { HGSSSAV } from "../types/SAVTypes/HGSSSAV";
import { ORASSAV } from "../types/SAVTypes/ORASSAV";
import { PtSAV } from "../types/SAVTypes/PtSAV";
import { G3RRSAV } from "../types/SAVTypes/radicalred/G3RRSAV";
import { SMSAV } from "../types/SAVTypes/SMSAV";
import { USUMSAV } from "../types/SAVTypes/USUMSAV";
import { SAVClass } from "../types/SAVTypes/util";
import { XYSAV } from "../types/SAVTypes/XYSAV";

export type Settings = {
  enabledSaveTypes: Record<string, boolean>;
  officialSaveTypes: SAVClass[];
  extraSaveTypes: SAVClass[];
};

export type AppInfoState = {
  resourcesPath?: string;
  settings: Settings;
};

export type AppInfoAction =
  | {
      type: "set_resources_path";
      payload: string;
    }
  | {
      type: "set_savetype_enabled";
      payload: {
        saveType: SAVClass;
        enabled: boolean;
      };
    };
>>>>>>> tauri

export const appInfoReducer: Reducer<AppInfoState, AppInfoAction> = (
  state: AppInfoState,
  action: AppInfoAction
) => {
<<<<<<< HEAD
  const { type, payload } = action
  switch (type) {
    case 'set_resources_path': {
      return {
        ...state,
        resourcesPath: payload,
      }
    }
    case 'set_savetype_enabled': {
      const enabled = state.settings.enabledSaveTypes
      if (payload.enabled) {
        enabled[payload.saveType.name] = true
      } else {
        enabled[payload.saveType.name] = false
      }
      return { ...state, settings: { ...state.settings, enabledSaveTypes: enabled } }
    }
  }
}
=======
  const { type, payload } = action;
  switch (type) {
    case "set_resources_path": {
      return {
        ...state,
        resourcesPath: payload,
      };
    }
    case "set_savetype_enabled": {
      const enabled = state.settings.enabledSaveTypes;
      if (payload.enabled) {
        enabled[payload.saveType.name] = true;
      } else {
        enabled[payload.saveType.name] = false;
      }
      return {
        ...state,
        settings: { ...state.settings, enabledSaveTypes: enabled },
      };
    }
  }
};
>>>>>>> tauri

export const appInfoInitialState: AppInfoState = {
  settings: {
    officialSaveTypes: [
      G1SAV,
      G2SAV,
      G3SAV,
      DPSAV,
      PtSAV,
      HGSSSAV,
      BWSAV,
      BW2SAV,
      XYSAV,
      ORASSAV,
      SMSAV,
      USUMSAV,
    ],
    extraSaveTypes: [G3RRSAV],
    enabledSaveTypes: Object.fromEntries(
      [
        G1SAV,
        G2SAV,
        G3SAV,
        DPSAV,
        PtSAV,
        HGSSSAV,
        BWSAV,
        BW2SAV,
        XYSAV,
        ORASSAV,
        SMSAV,
        USUMSAV,
        G3RRSAV,
      ].map((savetype) => [savetype.name, true])
    ),
  },
<<<<<<< HEAD
}

export const AppInfoContext = createContext<
  [AppInfoState, Dispatch<AppInfoAction>, () => SAVClass[]]
>([appInfoInitialState, () => null, () => []])
=======
};

export const AppInfoContext = createContext<
  [AppInfoState, Dispatch<AppInfoAction>, () => SAVClass[]]
>([appInfoInitialState, () => null, () => []]);
>>>>>>> tauri
