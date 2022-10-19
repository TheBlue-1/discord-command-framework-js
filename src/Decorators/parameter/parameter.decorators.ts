import {
  CommandOptionChoiceResolvableType,
  CommandOptionNumericResolvableType,
  ExcludeEnum,
} from "discord.js";
import { ChannelTypes } from "discord.js/typings/enums";

import {
  CommandChoice,
  CommandOptionParameterType,
} from "../../slash-command-generator";
import { setParam } from "./parameter.helpers";
import {
  InteractionParameter,
  AttributeName,
  InteractionAttribute,
} from "./parameter.types";

export function param(
  name: string,
  description = "",
  type: CommandOptionParameterType = "STRING",
  defaultValue?: any
) {
  return function (
    target: { constructor: new () => any },
    propertyKey: string,
    index: number
  ): void {
    setParam(
      target.constructor.name,
      propertyKey,
      index,
      new InteractionParameter(name, description, type, {
        defaultValue: defaultValue,
      })
    );
  };
}
export function autocomplete(
  name: string,
  description = "",
  autocompletions: (string | number)[],
  type: CommandOptionChoiceResolvableType = "STRING",
  defaultValue?: any
) {
  return function (
    target: { constructor: new () => any },
    propertyKey: string,
    index: number
  ): void {
    setParam(
      target.constructor.name,
      propertyKey,
      index,
      new InteractionParameter(name, description, type, {
        defaultValue: defaultValue,
        autocompletions: autocompletions,
      })
    );
  };
}

export function choice<T extends string | number>(
  name: string,
  description: string,
  choices: CommandChoice<T>[],
  type: T extends number ? "INTEGER" | "NUMBER" : "STRING",
  defaultValue?: any
) {
  return function (
    target: { constructor: new () => any },
    propertyKey: string,
    index: number
  ): void {
    setParam(
      target.constructor.name,
      propertyKey,
      index,
      new InteractionParameter(name, description, type, {
        defaultValue: defaultValue,
        choices: choices,
      })
    );
  };
}
export function minmax(
  name: string,
  description = "",
  min?: number,
  max?: number,
  type: CommandOptionNumericResolvableType = "NUMBER",
  defaultValue?: any
) {
  return function (
    target: { constructor: new () => any },
    propertyKey: string,
    index: number
  ): void {
    setParam(
      target.constructor.name,
      propertyKey,
      index,
      new InteractionParameter(name, description, type, {
        defaultValue: defaultValue,
        minValue: min,
        maxValue: max,
      })
    );
  };
}
export function channelParam(
  name: string,
  description = "",
  channelTypes?: ExcludeEnum<typeof ChannelTypes, "UNKNOWN">[],
  defaultValue?: any
) {
  return function (
    target: { constructor: new () => any },
    propertyKey: string,
    index: number
  ): void {
    setParam(
      target.constructor.name,
      propertyKey,
      index,
      new InteractionParameter(name, description, "CHANNEL", {
        defaultValue: defaultValue,
        channelTypes: channelTypes,
      })
    );
  };
}

export function user(): ReturnType<typeof attribute> {
  return attribute("user");
}
export function channel(): ReturnType<typeof attribute> {
  return attribute("channel");
}

export function attribute(name: AttributeName) {
  return function (
    target: { constructor: new () => any },
    propertyKey: string,
    index: number
  ): void {
    setParam(
      target.constructor.name,
      propertyKey,
      index,
      new InteractionAttribute(name)
    );
  };
}
