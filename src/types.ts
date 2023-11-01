// unknown but better
export type CustomUnknown =
  | CustomUnknown[]
  | ReturnType<() => void> // just adding void wouldn't work
  | bigint
  | boolean
  | number
  | object
  | string
  | symbol
  | (() => void)
  | null
  | undefined;

export type DeepReadonly<T> = T extends () => void
  ? T
  : T extends object
  ? Readonly<{
      [P in keyof T]: DeepReadonly<T[P]>;
    }>
  : T;

type o = Readonly<() => void>;
