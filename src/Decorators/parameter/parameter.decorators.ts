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
  AttributeName,
  InteractionAttribute,
  InteractionParameter,
} from "./parameter.types";

export function Param(
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
export function Autocomplete(
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

export function Choice<T extends string | number>(
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
export function Minmax(
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
export function ChannelParam(
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

export function User(): ReturnType<typeof Attribute> {
  return Attribute("user");
}
export function Channel(): ReturnType<typeof Attribute> {
  return Attribute("channel");
}

export function Attribute(name: AttributeName) {
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
