import {
  CommandInteraction,
  CommandOptionChoiceResolvableType,
  CommandOptionNumericResolvableType,
  ExcludeEnum,
} from 'discord.js';
import { ChannelTypes } from 'discord.js/typings/enums';

import { CommandChoice, CommandOptionParameterType } from '../slash-command-generator';

//TODO add autocompletions
export const parameterRegister: { [className: string]: { [methodName: string]: (InteractionParameter | InteractionAttribute)[] } } = {
};

const setParam = (className: string, methodName: string, index: number, parameter: InteractionParameter | InteractionAttribute) => {
  if (parameterRegister[className] == undefined) {
    parameterRegister[className] = {}
  } if (parameterRegister[className][methodName] == undefined) {
    parameterRegister[className][methodName] = []
  }

  parameterRegister[className][methodName][index] = parameter;
}

export function param(name: string, description = "", type: CommandOptionParameterType = "STRING", optional = false) {
  return function (target: { constructor: new () => any }, propertyKey: string, index: number): void {
    setParam(target.constructor.name, propertyKey, index, new InteractionParameter(name, description, type, { optional: optional }));
  };
}
export function autocomplete(name: string, description = "", autocompletions: (string | number)[], type: CommandOptionChoiceResolvableType = "STRING", optional = false) {
  return function (target: { constructor: new () => any }, propertyKey: string, index: number): void {
    setParam(target.constructor.name, propertyKey, index, new InteractionParameter(name, description, type, { optional: optional, autocompletions: autocompletions }));
  };
}

export function choice<T extends string | number>(name: string, description: string, choices: CommandChoice<T>[], type: T extends number ? "INTEGER" | "NUMBER" : "STRING", optional = false) {
  return function (target: { constructor: new () => any }, propertyKey: string, index: number): void {
    setParam(target.constructor.name, propertyKey, index, new InteractionParameter(name, description, type, { optional: optional, choices: choices }));
  };
}
export function minmax(name: string, description = "", min?: number, max?: number, type: CommandOptionNumericResolvableType = "NUMBER", optional = false) {
  return function (target: { constructor: new () => any }, propertyKey: string, index: number): void {
    setParam(target.constructor.name, propertyKey, index, new InteractionParameter(name, description, type, { optional: optional, minValue: min, maxValue: max }));
  };
}
export function channelParam(name: string, description = "", channelTypes?: ExcludeEnum<typeof ChannelTypes, 'UNKNOWN'>[], optional = false) {
  return function (target: { constructor: new () => any }, propertyKey: string, index: number): void {
    setParam(target.constructor.name, propertyKey, index, new InteractionParameter(name, description, "CHANNEL", { optional: optional, channelTypes: channelTypes }));
  };
}

export class InteractionParameter {
  public methodParameterType: "parameter" = "parameter";

  constructor(
    public name: string,
    public description: string,
    public type: CommandOptionParameterType,
    public options: {
      optional?: boolean,
      channelTypes?: ExcludeEnum<typeof ChannelTypes, 'UNKNOWN'>[],
      choices?: CommandChoice<string | number>[],
      minValue?: number,
      maxValue?: number
      , autocompletions?: (string | number)[]
    }

  ) { }
}
export class InteractionAttribute {
  public methodParameterType: "attribute" = "attribute";

  constructor(public name: AttributeName) { }
}

export function user(): ReturnType<typeof attribute> {
  return attribute("user")
}
export function channel(): ReturnType<typeof attribute> {
  return attribute("channel")
}

export function attribute(name: AttributeName) {
  return function (target: { constructor: new () => any }, propertyKey: string, index: number): void {
    setParam(target.constructor.name, propertyKey, index, new InteractionAttribute(name));
  };
}
// eslint-disable-next-line @typescript-eslint/ban-types
export type AttributeName = keyof { [Property in keyof CommandInteraction as CommandInteraction[Property] extends Function ? never : Property]: undefined; };