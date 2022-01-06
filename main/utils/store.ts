import create from "zustand/vanilla";
import createStore from "zustand";
import { ListAction, ListState } from "./list";
import React from "react";
import { BottomSheetModalMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
import { Variable } from "./variable";

type State = {
  db_updation_toggle: boolean;
  toggle_db_update_toggle: () => void;
  bottom_sheet_props:
    | {
        state: ListState;
        dispatch: React.Dispatch<ListAction>;
        render_list_element: [
          (props: {
            selected: number;
            variable: Variable;
            disptach_values: (variable: Variable) => void;
          }) => JSX.Element,
          Record<
            string,
            (props: {
              selected: number;
              variable: Variable;
              disptach_values: (variable: Variable) => void;
            }) => JSX.Element
          >
        ];
        // view: React.RefObject<BottomSheetModalMethods>;
        // sorting: React.RefObject<BottomSheetModalMethods>;
        // sorting_fields: React.RefObject<BottomSheetModalMethods>;
        // filters: React.RefObject<BottomSheetModalMethods>;
      }
    | undefined;
  set_bottom_sheet_props: (x: {
    state: ListState;
    dispatch: React.Dispatch<ListAction>;
    render_list_element: [
      (props: {
        selected: number;
        variable: Variable;
        disptach_values: (variable: Variable) => void;
      }) => JSX.Element,
      Record<
        string,
        (props: {
          selected: number;
          variable: Variable;
          disptach_values: (variable: Variable) => void;
        }) => JSX.Element
      >
    ];
    // view: React.RefObject<BottomSheetModalMethods>;
    // sorting: React.RefObject<BottomSheetModalMethods>;
    // sorting_fields: React.RefObject<BottomSheetModalMethods>;
    // filters: React.RefObject<BottomSheetModalMethods>;
  }) => Promise<void>;
};

// Note: fields in store should be mutable, or change is not reflected where they are used.
// Store is limited to per page open, use Local Storage to sync store every few seconds.
export const store = create<State>((set, get) => ({
  db_updation_toggle: false,
  toggle_db_update_toggle: () => {
    console.log("store value was toggled");
    set({ db_updation_toggle: !get().db_updation_toggle });
  },
  bottom_sheet_props: undefined,
  set_bottom_sheet_props: async (x) => {
    set({ bottom_sheet_props: x });
  },
}));

export const { getState, setState, subscribe, destroy } = store;

export const useStore = createStore(store);
