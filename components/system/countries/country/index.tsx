import React, { useEffect, useState } from "react";
import { Immutable, Draft } from "immer";
import { useImmerReducer } from "use-immer";
import { HashSet, Option, Vector } from "prelude-ts";
import { Path, StrongEnum, Struct } from "../../../../main/utils/variable";
import { get_structs } from "../../../../main/utils/schema";

import { Text, View } from "../../../../main/themed";
import { iff } from "../../../../pibity-erp/src/main/utils";
import {
  apply,
  CustomError,
  Err,
  errors,
  Message,
  Ok,
  Result,
  unwrap,
  unwrap_array,
} from "../../../../main/utils/prelude";
import { Input } from "../../../../pibity-erp/src/main/Table";
import { TextInput } from "react-native";
import { PrivateValueStore } from "@react-navigation/core";

const struct: Option<Struct> = get_structs()
  .filter((s) => s.name === "Country")
  .single();

type State = Immutable<{
  struct: Struct;
  id: number | undefined;
  values: {
    name: [
      ["name"],
      {
        type: "str";
        value: string;
      }
    ];
  };
}>;

type Action = [Path, StrongEnum];

function reducer(state: Draft<State>, action: Action) {}

export default function Component(props: {
  id: number | undefined;
  // ownership paths and borrow paths will be provided
  ownership: ReadonlyArray<string>;
  borrow: ReadonlyArray<string>;
}): JSX.Element {
  if (struct.isSome()) {
    if (props.id === undefined) {
      const init: State = {
        struct: struct.get(),
        id: undefined,
        values: {
          name: [
            ["name"],
            {
              type: "str",
              value: "",
            },
          ],
        },
      };
      const [state, dispatch] = useImmerReducer<State, Action>(reducer, init);

      return (
        <>
          <View>
            <Text>Name</Text>
            <TextInput
              // style={styles.input}
              // onChangeText={onChangeText}
              value={state.values.name[1].value}
            />
          </View>
        </>
      );
    } else {
      return <Text>Component will show or update or delete</Text>;
    }
  } else {
    // return new Err(new CustomError([errors.ErrUnexpected] as Message));
    return <Text>Component will show or update or delete</Text>;
  }
}

export function validate_ownership_path(
  struct: Struct,
  path: ReadonlyArray<string>
): Result<ReadonlyArray<string>> {
  if (path.length !== 0) {
    const field_name = path[0];
    const field = struct.fields.findAny((f) => f.name === path[0]);
    // field at start of path must exist
    if (field.isSome()) {
      const f = field.get();
      // field must point to a non primitive type
      if (f.value.type === "other") {
        const non_primitive_struct = f.value.other;
        // if there are no more fields, non primitive type pointed must be User struct
        if (non_primitive_struct === "User" && path.length === 1) {
          return new Ok([f.name]);
        } else {
          // get struct pointed by the field at start of path
          const next_struct = get_structs()
            .filter((s) => s.name === non_primitive_struct)
            .single();
          // struct pointed must exist
          if (next_struct.isSome()) {
            // validate path recursively
            const next_result = validate_ownership_path(
              next_struct.get(),
              path.slice(1)
            );
            if (unwrap(next_result)) {
              return new Ok([f.name, ...next_result.value]);
            }
          }
        }
      }
    }
  }
  return new Err(new CustomError([errors.ErrUnexpected] as Message));
}

export function get_permissions(
  struct: Struct,
  ownership_paths: ReadonlyArray<ReadonlyArray<string>>,
  borrow_fields: ReadonlyArray<string>
): Result<
  [ReadonlyArray<ReadonlyArray<string>>, ReadonlyArray<ReadonlyArray<string>>]
> {
  // validate user pointing paths
  const result = unwrap_array(
    ownership_paths.map((path) => validate_ownership_path(struct, path))
  );
  if (unwrap(result)) {
    // get fields which can be used to prove ownership
    const all_ownership_fields: HashSet<string> = HashSet.ofIterable(
      struct.permissions.ownership.map((x) => x[0])
    );
    // get ownership fields which which can be borrowed against
    const all_borrow_fields: HashSet<string> = HashSet.ofIterable(
      Object.keys(struct.permissions.borrow).filter((borrow_field) =>
        all_ownership_fields.contains(borrow_field)
      )
    );
    // get paths (leaf points to User struct) which are used to prove ownership
    const allowed_ownership_paths: ReadonlyArray<ReadonlyArray<string>> =
      result.value.filter(
        (path) => path.length !== 0 && all_ownership_fields.contains(path[0])
      );
    // get ownership fields that are accessed while traversing user-pointing paths
    const accessed_ownership_fields: HashSet<string> = HashSet.ofIterable(
      allowed_ownership_paths.map((path) => path[0])
    );
    // get ownership fields that were not at start of user pointing paths, but borrowed instead
    const allowed_borrow_fields = all_borrow_fields.filter(
      (borrow_field) =>
        !accessed_ownership_fields.contains(borrow_field) &&
        borrow_fields.includes(borrow_field)
    );
    const read_permissions: Array<Array<string>> = [];
    const write_permissions: Array<Array<string>> = [];
    for (let ownership_path of allowed_ownership_paths) {
      const result = get_permissions_for_owned_field(
        [],
        struct,
        ownership_path,
        false
      );
      if (unwrap(result)) {
        const [nested_write_permissions, nested_read_permissions] =
          result.value;
        write_permissions.push(
          ...(nested_write_permissions as Array<Array<string>>)
        );
        read_permissions.push(
          ...(nested_read_permissions as Array<Array<string>>)
        );
      } else {
        return new Err(new CustomError([errors.ErrUnexpected] as Message));
      }
    }
    for (let borrow_field_name of allowed_borrow_fields) {
      // get borrow field
      const borrow_field = struct.permissions.borrow[borrow_field_name];
      // validate borrowed ownership fields
      const result = unwrap_array(
        borrow_field.ownership.map((path) =>
          validate_ownership_path(struct, path)
        )
      );
      // validate user pointing paths
      if (unwrap(result)) {
        // get paths (leaf points to User struct) which are used to prove ownership
        const allowed_borrowed_ownership_paths: ReadonlyArray<
          ReadonlyArray<string>
        > = result.value.filter(
          (path) => path.length !== 0 && all_ownership_fields.contains(path[0])
        );
        for (let borrowed_ownership_path of allowed_borrowed_ownership_paths) {
          const result = get_permissions_for_owned_field(
            [],
            struct,
            borrowed_ownership_path,
            true
          );
          if (unwrap(result)) {
            const [nested_write_permissions, nested_read_permissions] =
              result.value;
            read_permissions.push(
              ...(nested_write_permissions as Array<Array<string>>),
              ...(nested_read_permissions as Array<Array<string>>)
            );
          } else {
            return new Err(new CustomError([errors.ErrUnexpected] as Message));
          }
        }
      }
    }
    // return a tuple of write and read permissions
    return new Ok([write_permissions, read_permissions] as [
      ReadonlyArray<ReadonlyArray<string>>,
      ReadonlyArray<ReadonlyArray<string>>
    ]);
  }
  return new Err(new CustomError([errors.ErrUnexpected] as Message));
}

function get_permissions_for_owned_field(
  prefix: ReadonlyArray<string>,
  struct: Struct,
  ownership_path: ReadonlyArray<string>,
  borrow: boolean
): Result<
  [ReadonlyArray<ReadonlyArray<string>>, ReadonlyArray<ReadonlyArray<string>>]
> {
  if (ownership_path.length !== 0) {
    // get owned field name from start of user pointing path
    const owned_field_name = ownership_path[0];
    // permissions must be defined against the owned field
    if (owned_field_name in struct.permissions.private) {
      const permissions = struct.permissions.private[owned_field_name];
      // get write permissions against owned field
      const write_permissions: Array<ReadonlyArray<string>> =
        permissions.write.map((x) => [...prefix, ...x[0]]);
      // get read permissions against owned field
      // also, for owned field itself, read permission is granted
      const read_permissions: Array<ReadonlyArray<string>> = apply(
        permissions.read.map((x) => [...prefix, ...x[0]]),
        (it) => {
          it.push([...prefix, owned_field_name]);
          it.push(
            ...struct.permissions.public.map((x) => [...prefix, ...x[0]])
          );
          return it;
        }
      );
      // get the owned field
      const owned_field = struct.fields.findAny(
        (field) => field.name === owned_field_name
      );
      // owned field must exist in fields of the struct
      // owned field could could be traversed into, if itself doesnt point to User struct
      if (owned_field.isSome() && ownership_path.length !== 1) {
        // get owned field
        const owned_field_value = owned_field.get().value;
        // fields inside user pointing path must be non primitive
        if (owned_field_value.type === "other") {
          // get struct against owned field
          const next_struct = get_structs()
            .filter((s) => s.name === owned_field_value.other)
            .single();
          // struct pointed by owned field must exist
          // second field of user pointing path must exist as a key in above mentioned struct
          if (
            next_struct.isSome() &&
            next_struct
              .get()
              .fields.anyMatch((field) => field.name === ownership_path[1])
          ) {
            // recursively try to get the read and write permissions
            // prefix owned field name to all permissions
            const result = get_permissions_for_owned_field(
              [...prefix, owned_field_name],
              next_struct.get(),
              ownership_path.slice(1),
              borrow
            );
            if (unwrap(result)) {
              const [nested_write_permissions, nested_read_permissions] =
                result.value;
              if (borrow) {
                return new Ok([
                  [],
                  apply(read_permissions, (it) => {
                    it.push(
                      ...nested_write_permissions,
                      ...nested_read_permissions
                    );
                    return it;
                  }),
                ] as [ReadonlyArray<ReadonlyArray<string>>, ReadonlyArray<ReadonlyArray<string>>]);
              } else {
                return new Ok([
                  apply(write_permissions, (it) => {
                    it.push(...nested_write_permissions);
                    return it;
                  }),
                  apply(read_permissions, (it) => {
                    it.push(...nested_read_permissions);
                    return it;
                  }),
                ] as [ReadonlyArray<ReadonlyArray<string>>, ReadonlyArray<ReadonlyArray<string>>]);
              }
            } else {
              return new Err(
                new CustomError([errors.ErrUnexpected] as Message)
              );
            }
          }
        }
        return new Err(new CustomError([errors.ErrUnexpected] as Message));
      }
      if (borrow) {
        return new Ok([[], [...write_permissions, ...read_permissions]] as [
          ReadonlyArray<ReadonlyArray<string>>,
          ReadonlyArray<ReadonlyArray<string>>
        ]);
      } else {
        return new Ok([write_permissions, read_permissions] as [
          ReadonlyArray<ReadonlyArray<string>>,
          ReadonlyArray<ReadonlyArray<string>>
        ]);
      }
    }
  }
  return new Err(new CustomError([errors.ErrUnexpected] as Message));
}
