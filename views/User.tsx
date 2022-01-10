import { Variable } from "../main/utils/variable";

type A = Record<
  string, // View name (Default, Compact, etc)
  {
    create: (props: {
      selected: number;
      variable: Variable;
      update_parent_values: (variable: Variable) => void;
    }) => JSX.Element;
    update: (props: {
      selected: number;
      variable: Variable;
      update_parent_values: (variable: Variable) => void;
    }) => JSX.Element;
    show: (props: {
      selected: number;
      variable: Variable;
      update_parent_values: (variable: Variable) => void;
    }) => JSX.Element;
  }
>;

type B = Record<string, A>;

// Test component should be abstracted out

// And above function calls should be able to plugin into it

//// () => JSX.Element [abstracted element]

// (props: {
//     struct: Struct;
//     state: State;
//     dispatch: React.Dispatch<Action>;
//   }): JSX.Element

// (props: {
//     variable: Variable;
//     selected: number;
//     update_parent_values: (variable: Variable) => void;
//   }) => JSX.Element
