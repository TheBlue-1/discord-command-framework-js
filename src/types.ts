// unknown but better
export type CustomUnknown =
  | CustomUnknown[]
  | Promise<CustomUnknown> // allows to await
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
