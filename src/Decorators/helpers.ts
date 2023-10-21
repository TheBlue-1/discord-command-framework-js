function isConstructor(f: unknown): f is new () => unknown {
  if (typeof f !== "function") return false;
  try {
    new (f as new () => unknown)();
  } catch (err) {
    if (
      typeof err === "object" &&
      err !== null &&
      "message" in err &&
      typeof err.message === "string" &&
      err.message.includes("is not a constructor")
    ) {
      return false;
    }
  }
  return true;
}

function hasConstructor(
  obj: object,
): obj is { constructor: new () => unknown } {
  return "constructor" in obj && isConstructor(obj.constructor);
}

function hasFunction<T extends string>(
  obj: object,
  property: T,
): obj is Record<T, () => Promise<void> | void> {
  return (
    property in obj && typeof obj[property as keyof typeof obj] === "function"
  );
}

export function methodDecorator(
  fn: <T extends "constructor" extends T ? never : string>(
    target: Record<T, () => Promise<void> | void> & {
      constructor: new () => unknown;
    },
    propertyKey: T,
    descriptor: PropertyDescriptor,
  ) => void,
) {
  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ): void {
    if (typeof propertyKey !== "string") {
      throw new Error("propertyKey is not a string");
    }

    const typedPropertyKey = propertyKey as "propertyKey"; // it could of course be any string, but for ts it needs to be a specific string

    if (!hasConstructor(target)) throw new Error("target has no constructor");
    if (!hasFunction(target, typedPropertyKey)) {
      throw new Error("propertyKey is not a function in target");
    }

    fn(target, typedPropertyKey, descriptor);
  };
}

export function classDecorator(fn: (target: new () => unknown) => void) {
  return function (target: new () => unknown): void {
    fn(target);
  };
}

export function paramDecorator(
  fn: <T extends "constructor" extends T ? never : string>(
    target: Record<T, () => Promise<void> | void> & {
      constructor: new () => unknown;
    },
    propertyKey: T,
    parameterIndex: number,
  ) => void,
) {
  return function (
    target: object,
    propertyKey: string | symbol,
    parameterIndex: number,
  ): void {
    if (typeof propertyKey !== "string") {
      throw new Error("propertyKey is not a string");
    }

    const typedPropertyKey = propertyKey as "propertyKey"; // it could of course be any string, but for ts it needs to be a specific string

    if (!hasConstructor(target)) throw new Error("target has no constructor");
    if (!hasFunction(target, typedPropertyKey)) {
      throw new Error("propertyKey is not a function in target");
    }

    fn(target, typedPropertyKey, parameterIndex);
  };
}
