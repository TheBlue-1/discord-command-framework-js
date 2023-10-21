import type { CommandInteraction, ExcludeEnum } from "discord.js";
import type { ChannelTypes } from "discord.js/typings/enums";

import type {
  CommandChoice,
  CommandOptionParameterType,
} from "../../slash-command-generator";

export class InteractionParameter {
  public methodParameterType = "parameter" as const;

  public constructor(
    public name: string,
    public description: string,
    public type: CommandOptionParameterType,
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
