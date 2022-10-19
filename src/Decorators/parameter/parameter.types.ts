import { CommandInteraction, ExcludeEnum } from "discord.js";
import { ChannelTypes } from "discord.js/typings/enums";

import {
  CommandChoice,
  CommandOptionParameterType,
} from "../../slash-command-generator";

export class InteractionParameter {
  public methodParameterType: "parameter" = "parameter";

  constructor(
    public name: string,
    public description: string,
    public type: CommandOptionParameterType,
    public options: {
      optional?: boolean;
      defaultValue?: boolean;
      channelTypes?: ExcludeEnum<typeof ChannelTypes, "UNKNOWN">[];
      choices?: CommandChoice<string | number>[];
      minValue?: number;
      maxValue?: number;
      autocompletions?: (string | number)[];
    }
  ) {
    if (options.defaultValue != undefined) options.optional = true;
  }
}
export class InteractionAttribute {
  public methodParameterType: "attribute" = "attribute";

  constructor(public name: AttributeName) {}
}

export type AttributeName = keyof {
  // eslint-disable-next-line @typescript-eslint/ban-types
  [Property in keyof CommandInteraction as CommandInteraction[Property] extends Function
    ? never
    : Property]: undefined;
};
