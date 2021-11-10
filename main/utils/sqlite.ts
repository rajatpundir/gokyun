import Decimal from "decimal.js";
import { Immutable } from "immer";
import { HashSet, Vector } from "prelude-ts";
import { Struct, Path, PathFilter } from "./variable";

export async function get_variables(
  struct: Struct,
  permissions: [HashSet<Vector<string>>, HashSet<Vector<string>>],
  // below four fields will not be passed as props to Box
  // but Box would user to select them
  requested_paths: HashSet<Path>,
  filters: Immutable<ReadonlyArray<[boolean, HashSet<PathFilter>]>>,
  limit: Immutable<Decimal>,
  offset: Immutable<Decimal>
): Promise<
  Array<{
    struct: Struct;
    id: Decimal;
    paths: HashSet<Path>;
  }>
> {
  return [
    {
      struct: struct,
      id: new Decimal(1),
      paths: HashSet.of(),
    },
    {
      struct: struct,
      id: new Decimal(12),
      paths: HashSet.of(),
    },
    {
      struct: struct,
      id: new Decimal(13),
      paths: HashSet.of(),
    },
    {
      struct: struct,
      id: new Decimal(14),
      paths: HashSet.of(),
    },
  ];
}
