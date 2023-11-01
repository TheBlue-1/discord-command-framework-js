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

// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types, @typescript-eslint/no-explicit-any
export type DeepReadonly<T> = T extends (...args: any[]) => void
  ? T
  : T extends object
  ? Readonly<{
      [P in keyof T]: DeepReadonly<T[P]>;
    }>
  : T;
