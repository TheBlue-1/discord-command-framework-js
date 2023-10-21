import type { CommandInteraction, ExcludeEnum } from "discord.js";
import type { ChannelTypes } from "discord.js/typings/enums";

import {
  commandOptionParameterTypeToEnum,
  type CommandChoice,
  type CommandOptionParameterType,
} from "../../slash-command-generator";

export class InteractionParameter {
  public methodParameterType = "parameter" as const;
  public type: Exclude<CommandOptionParameterType, string>;

  public constructor(
    public name: string,
    public description: string,
    type: CommandOptionParameterType,
    public options: {
      optional?: boolean;
      defaultValue?: unknown;
      channelTypes?: ExcludeEnum<typeof ChannelTypes, "UNKNOWN">[] | undefined;
      choices?: CommandChoice<number | string>[];
      minValue?: number | undefined;
      maxValue?: number | undefined;
      autocompletions?: (number | string)[];
    },
  ) {
    this.type = commandOptionParameterTypeToEnum(type);
    if (options.defaultValue !== undefined) options.optional = true;
  }
}
export class InteractionAttribute {
  public methodParameterType = "attribute" as const;

  public constructor(public name: AttributeName) {}
}

export type AttributeName = keyof {
  [Property in keyof CommandInteraction as CommandInteraction[Property] extends () => void
    ? never
    : Property]: undefined;
};
