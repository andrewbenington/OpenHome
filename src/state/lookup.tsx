import {
  createContext,
  Dispatch,
  PropsWithChildren,
  Reducer,
  useReducer,
} from "react";
import { OHPKM } from "src/types/pkm/OHPKM";
import { LookupMap } from "../types/types";

export type LookupState = {
  error?: string;
} & (
  | {
      homeMons: Record<string, OHPKM>;
      gen12: LookupMap;
      gen345: LookupMap;
      loaded: true;
    }
  | {
      homeMons?: Record<string, OHPKM>;
      gen12?: LookupMap;
      gen345?: LookupMap;
      loaded: false;
    }
);

export type LookupAction =
  | {
      type: "load_gen12";
      payload: LookupMap;
    }
  | {
      type: "load_gen345";
      payload: LookupMap;
    }
  | {
      type: "load_home_mons";
      payload: Record<string, OHPKM>;
    }
  | {
      type: "set_error";
      payload: string | undefined;
    }
  | {
      type: "clear";
      payload?: undefined;
    };

const reducer: Reducer<LookupState, LookupAction> = (
  state: LookupState,
  action: LookupAction
) => {
  const { type, payload } = action;
  switch (type) {
    case "set_error": {
      return {
        ...state,
        error: payload,
      };
    }
    case "load_gen12": {
      const newState: LookupState = { ...state, gen12: payload };
      if (newState.gen345 && newState.homeMons && newState.gen12) {
        newState.loaded = true;
      }
      return newState;
    }
    case "load_gen345": {
      const newState: LookupState = { ...state, gen345: payload };
      if (newState.gen345 && newState.homeMons && newState.gen12) {
        newState.loaded = true;
      }
      return newState;
    }
    case "load_home_mons": {
      const homeMons: Record<string, OHPKM> = payload;
      const newState: LookupState = { ...state, homeMons };
      if (newState.gen345 && newState.homeMons && newState.gen12) {
        newState.loaded = true;
      }
      return newState;
    }
    case "clear": {
      return { loaded: false };
    }
  }
};

const initialState: LookupState = { loaded: false };

export const LookupContext = createContext<
  [LookupState, Dispatch<LookupAction>]
>([initialState, () => {}]);

export function LookupProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer<Reducer<LookupState, LookupAction>>(
    reducer,
    initialState
  );

  return (
    <LookupContext.Provider value={[state, dispatch]}>
      {children}
    </LookupContext.Provider>
  );
}
