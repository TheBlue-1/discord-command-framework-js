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
