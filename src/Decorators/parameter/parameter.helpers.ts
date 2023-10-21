import type {
  InteractionAttribute,
  InteractionParameter,
} from "./parameter.types";

// TODO add autocompletions
export const parameterRegister: Record<
  string,
  Record<string, (InteractionAttribute | InteractionParameter)[]>
> = {};

export const setParam = (
  className: string,
  methodName: string,
  index: number,
  parameter: InteractionAttribute | InteractionParameter,
) => {
  const classRecord = parameterRegister[className] ?? {};
  if (parameterRegister[className] === undefined) {
    parameterRegister[className] = classRecord;
  }

  const methodRecord = classRecord[methodName] ?? [];
  if (classRecord[methodName] === undefined) {
    classRecord[methodName] = methodRecord;
  }

  methodRecord[index] = parameter;
};
