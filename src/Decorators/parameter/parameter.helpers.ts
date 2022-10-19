import { InteractionParameter, InteractionAttribute } from "./parameter.types";

//TODO add autocompletions
export const parameterRegister: {
  [className: string]: {
    [methodName: string]: (InteractionParameter | InteractionAttribute)[];
  };
} = {};

export const setParam = (
  className: string,
  methodName: string,
  index: number,
  parameter: InteractionParameter | InteractionAttribute
) => {
  if (parameterRegister[className] == undefined) {
    parameterRegister[className] = {};
  }
  if (parameterRegister[className][methodName] == undefined) {
    parameterRegister[className][methodName] = [];
  }

  parameterRegister[className][methodName][index] = parameter;
};
