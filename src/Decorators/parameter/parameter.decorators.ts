import type {
  CommandOptionChoiceResolvableType,
  CommandOptionNumericResolvableType,
  ExcludeEnum,
} from "discord.js";
import type { ChannelTypes } from "discord.js/typings/enums";
import type {
  CommandChoice,
  CommandOptionParameterType,
} from "../../slash-command-generator";
import { paramDecorator } from "../helpers";
import { setParam } from "./parameter.helpers";
import {
  InteractionAttribute,
  InteractionParameter,
  type AttributeName,
} from "./parameter.types";

export function Param(
  name: string,
  description = "",
  type: CommandOptionParameterType = "STRING",
  defaultValue?: unknown,
) {
  return paramDecorator((target, propertyKey, index) => {
    setParam(
      target.constructor.name,
      propertyKey,
      index,
      new InteractionParameter(name, description, type, {
        defaultValue,
      }),
    );
  });
}
export function Autocomplete(
  name: string,
  autocompletions: (number | string)[],
  type: CommandOptionChoiceResolvableType = "STRING",
  defaultValue?: unknown,
  description = "",
) {
  return paramDecorator((target, propertyKey, index) => {
    setParam(
      target.constructor.name,
      propertyKey,
      index,
      new InteractionParameter(name, description, type, {
        defaultValue,
        autocompletions,
      }),
    );
  });
}

export function Choice<T extends number | string>(
  name: string,
  description: string,
  choices: CommandChoice<T>[],
  type: T extends number ? "INTEGER" | "NUMBER" : "STRING",
  defaultValue?: unknown,
) {
  return paramDecorator((target, propertyKey, index) => {
    setParam(
      target.constructor.name,
      propertyKey,
      index,
      new InteractionParameter(name, description, type, {
        defaultValue,
        choices,
      }),
    );
  });
}
export function Minmax(
  name: string,
  description = "",
  min?: number,
  max?: number,
  type: CommandOptionNumericResolvableType = "NUMBER",
  defaultValue?: unknown,
) {
  return paramDecorator((target, propertyKey, index) => {
    setParam(
      target.constructor.name,
      propertyKey,
      index,
      new InteractionParameter(name, description, type, {
        defaultValue,
        minValue: min,
        maxValue: max,
      }),
    );
  });
}
export function ChannelParam(
  name: string,
  description = "",
  channelTypes?: ExcludeEnum<typeof ChannelTypes, "UNKNOWN">[],
  defaultValue?: unknown,
) {
  return paramDecorator((target, propertyKey, index) => {
    setParam(
      target.constructor.name,
      propertyKey,
      index,
      new InteractionParameter(name, description, "CHANNEL", {
        defaultValue,
        channelTypes,
      }),
    );
  });
}

export function Attribute(name: AttributeName) {
  return paramDecorator((target, propertyKey, index) => {
    setParam(
      target.constructor.name,
      propertyKey,
      index,
      new InteractionAttribute(name),
    );
  });
}

export function User(): ReturnType<typeof Attribute> {
  return Attribute("user");
}
export function Channel(): ReturnType<typeof Attribute> {
  return Attribute("channel");
}
