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
  if (parameterRegister[className] == undefined) {
    parameterRegister[className] = {};
  }
  if (parameterRegister[className][methodName] == undefined) {
    parameterRegister[className][methodName] = [];
  }

  parameterRegister[className][methodName][index] = parameter;
};
