import type {
  ApplicationCommandOptionAllowedChannelTypes,
  CommandInteraction,
} from "discord.js";
import type {
  CommandChoice,
  CommandOptionParameterType,
} from "../../slash-command-generator";

export class InteractionParameter {
  public readonly methodParameterType = "parameter" as const;

  public readonly options: {
    readonly optional?: boolean;
    readonly defaultValue?: unknown;
    readonly channelTypes?:
      | readonly ApplicationCommandOptionAllowedChannelTypes[]
      | undefined;
    readonly choices?: readonly CommandChoice<number | string>[];
    readonly minValue?: number | undefined;
    readonly maxValue?: number | undefined;
    readonly autocompletions?: readonly (number | string)[];
  };

  public constructor(
    public readonly name: string,
    public readonly description: string,
    public readonly type: CommandOptionParameterType,
    options: {
      readonly optional?: boolean;
      readonly defaultValue?: unknown;
      readonly channelTypes?:
        | readonly ApplicationCommandOptionAllowedChannelTypes[]
        | undefined;
      readonly choices?: readonly CommandChoice<number | string>[];
      readonly minValue?: number | undefined;
      readonly maxValue?: number | undefined;
      readonly autocompletions?: readonly (number | string)[];
    },
  ) {
    this.options = {
      ...options,
      optional: options.defaultValue !== undefined || options.optional,
    };
  }
}
export class InteractionAttribute {
  public readonly methodParameterType = "attribute" as const;

  public constructor(public readonly name: AttributeName) {}
}

export type AttributeName = keyof {
  [Property in keyof CommandInteraction as CommandInteraction[Property] extends () => void
    ? never
    : Property]: undefined;
};
