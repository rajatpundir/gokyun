import create from "zustand/vanilla";
import {
  StoreApiWithSubscribeWithSelector,
  subscribeWithSelector,
} from "zustand/middleware";
import { GetState, SetState } from "zustand";

import { ListAction, ListState } from "./list";
import React from "react";
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
      }
    | undefined;
  bsm_view: number;
  bsm_sorting: number;
  bsm_sorting_fields: number;
  bsm_filters: number;
};

export const store = create<
  State,
  SetState<State>,
  GetState<State>,
  StoreApiWithSubscribeWithSelector<State>
>(
  subscribeWithSelector(
    (set, get) =>
      ({
        db_updation_toggle: false,
        toggle_db_update_toggle: () => {
          console.log("store value was toggled");
          set({ db_updation_toggle: !get().db_updation_toggle });
        },
        bottom_sheet_props: undefined,
        bsm_view: 0,
        bsm_sorting: 0,
        bsm_sorting_fields: 0,
        bsm_filters: 0,
      } as State)
  )
);

export const { getState, setState, subscribe, destroy } = store;
