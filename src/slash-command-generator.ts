import type {
  ApplicationCommandAutocompleteOption,
  ApplicationCommandChannelOptionData,
  ApplicationCommandChoicesData,
  ApplicationCommandNonOptionsData,
  ApplicationCommandNumericOption,
  ApplicationCommandNumericOptionData,
  ApplicationCommandOption,
  ApplicationCommandOptionChoice,
  ApplicationCommandSubCommandData,
  ApplicationCommandSubGroupData,
  ChatInputApplicationCommandData,
  CommandOptionChannelResolvableType,
  CommandOptionChoiceResolvableType,
  CommandOptionDataTypeResolvable,
  CommandOptionNonChoiceResolvableType,
  CommandOptionNumericResolvableType,
  CommandOptionSubOptionResolvableType,
  ExcludeEnum,
} from "discord.js";
import {
  ApplicationCommandOptionTypes,
  ApplicationCommandTypes,
  type ChannelTypes,
} from "discord.js/typings/enums";
import type { CommandGroupRegister } from "./Decorators/command/command.helpers";
import type {
  InteractionAttribute,
  InteractionParameter,
} from "./Decorators/parameter/parameter.types";

export class SlashCommand implements ChatInputApplicationCommandData {
  public type = ApplicationCommandTypes.CHAT_INPUT as const;

  public constructor(
    public name: string,
    public description: string,
    public options: CommandParameterOption[] | SubCommandOptions[],
  ) {}
}

export class SubCommandGroupOption implements ApplicationCommandSubGroupData {
  public type = ApplicationCommandOptionTypes.SUB_COMMAND_GROUP as const;

  public constructor(
    public name: string,
    public description: string,
    public options: SubCommandOption[],
  ) {}
}
export class SubCommandOption implements ApplicationCommandSubCommandData {
  public type = ApplicationCommandOptionTypes.SUB_COMMAND as const;

  public constructor(
    public name: string,
    public description: string,
    public options: CommandParameterOption[],
  ) {}
}

export type CommandParameterOption =
  | CommandChannelOption
  | CommandChoiceOption
  | CommandMinMaxOption
  | CommandSimpleOption;
export type SubCommandOptions = SubCommandGroupOption | SubCommandOption;
export type CommandSimpleOption =
  | CommandAutocompleteOption
  | CommandNoOptionsOption;

export class CommandNoOptionsOption
  implements ApplicationCommandNonOptionsData, DeepEqualsOption
{
  public constructor(
    public type: CommandOptionNonChoiceResolvableType,
    public name: string,
    public description: string,
    public required: boolean,
  ) {}

  public deepEquals(other: ApplicationCommandOption): boolean {
    if (other.name !== this.name) return false;
    if (other.type !== this.type) return false;
    if (other.description !== this.description) return false;
    if (other.required !== this.required) return false;
    return true;
  }
}

export class CommandAutocompleteOption
  implements ApplicationCommandAutocompleteOption, DeepEqualsOption
{
  public autocomplete: true = true;

  public constructor(
    public type:
      | ApplicationCommandOptionTypes.INTEGER
      | ApplicationCommandOptionTypes.NUMBER
      | ApplicationCommandOptionTypes.STRING
      | "INTEGER"
      | "NUMBER"
      | "STRING",
    public name: string,
    public description: string,
    public required: boolean,
  ) {
    this.autocomplete = false as true; // TODO think of something
  }

  public deepEquals(other: ApplicationCommandOption): boolean {
    if (other.name !== this.name) return false;
    if (other.type !== this.type) return false;
    if (other.description !== this.description) return false;
    if (other.required !== this.required) return false;
    if ((other.autocomplete as boolean) !== this.autocomplete) return false;

    return true;
  }
}
export class CommandChannelOption
  implements ApplicationCommandChannelOptionData, DeepEqualsOption
{
  public constructor(
    public type: CommandOptionChannelResolvableType,
    public name: string,
    public description: string,
    public required: boolean,
    public channelTypes:
      | ExcludeEnum<typeof ChannelTypes, "UNKNOWN">[]
      | undefined,
  ) {}

  public deepEquals(other: ApplicationCommandOption): boolean {
    if (other.name !== this.name) return false;
    if (other.type !== this.type) return false;
    if (other.description !== this.description) return false;
    if (other.required !== this.required) return false;
    if (other.channelTypes !== this.channelTypes) return false;

    return true;
  }
}

export class CommandChoiceOption implements ApplicationCommandChoicesData {
  public constructor(
    public type: CommandOptionChoiceResolvableType,
    public name: string,
    public description: string,
    public choices: CommandChoice<number | string>[],
    public required: boolean,
  ) {}
}
export class CommandMinMaxOption
  implements ApplicationCommandNumericOptionData, DeepEqualsOption
{
  public constructor(
    public type: CommandOptionNumericResolvableType,
    public name: string,
    public description: string,
    public required: boolean,
    public minValue: number | undefined,
    public maxValue: number | undefined,
  ) {}

  public deepEquals(other: ApplicationCommandOption): boolean {
    if (other.name !== this.name) return false;
    if (other.type !== this.type) return false;
    if (other.description !== this.description) return false;
    if (other.required !== this.required) return false;
    if ((other as ApplicationCommandNumericOption).minValue !== this.minValue) {
      return false;
    }
    if ((other as ApplicationCommandNumericOption).maxValue !== this.maxValue) {
      return false;
    }

    return true;
  }
}
export class CommandChoice<T extends number | string>
  implements ApplicationCommandOptionChoice
{
  public constructor(
    public name: string,
    public value: T,
  ) {}
}
export type CommandOptionParameterType = Exclude<
  CommandOptionDataTypeResolvable,
  CommandOptionSubOptionResolvableType
>;
export interface DeepEqualsOption {
  deepEquals(other: ApplicationCommandOption): boolean;
}

export class SlashCommandGenerator {
  public generate(groups: CommandGroupRegister): SlashCommand[] {
    const slashCommands: SlashCommand[] = [];
    for (const group of Object.values(groups)) {
      for (const command of Object.values(group.commands)) {
        const parameterOptions = this.getCommandParameterOptions(
          command.parameters,
        );
        slashCommands.push(
          new SlashCommand(command.name, command.description, parameterOptions),
        );
      }
      for (const commandArea of Object.values(group.commandAreas)) {
        const subCommandOptions: SubCommandOptions[] = [];

        for (const subCommand of Object.values(commandArea.subCommands)) {
          const parameterOptions = this.getCommandParameterOptions(
            subCommand.parameters,
          );

          subCommandOptions.push(
            new SubCommandOption(
              subCommand.name,
              subCommand.description,
              parameterOptions,
            ),
          );
        }

        for (const subCommandGroup of Object.values(
          commandArea.subCommandGroups,
        )) {
          const innerSubCommandOptions: SubCommandOption[] = [];
          for (const subCommand of Object.values(subCommandGroup.subCommands)) {
            const parameterOptions = this.getCommandParameterOptions(
              subCommand.parameters,
            );

            innerSubCommandOptions.push(
              new SubCommandOption(
                subCommand.name,
                subCommand.description,
                parameterOptions,
              ),
            );
          }
          subCommandOptions.push(
            new SubCommandGroupOption(
              subCommandGroup.name,
              subCommandGroup.description,
              innerSubCommandOptions,
            ),
          );
        }
        slashCommands.push(
          new SlashCommand(
            commandArea.name,
            commandArea.description,
            subCommandOptions,
          ),
        );
      }
    }
    return slashCommands;
  }

  protected getCommandParameterOptions(
    parameters: (InteractionAttribute | InteractionParameter)[],
  ): CommandParameterOption[] {
    const parameterOptions: CommandParameterOption[] = [];
    for (const parameter of parameters) {
      if (parameter.methodParameterType === "attribute") {
        continue;
      }

      let options: CommandParameterOption;
      parameter.type = SlashCommandGenerator.toEnumType(parameter.type);
      switch (parameter.type) {
        case ApplicationCommandOptionTypes.BOOLEAN:
        case ApplicationCommandOptionTypes.USER:
        case ApplicationCommandOptionTypes.ROLE:
        case ApplicationCommandOptionTypes.MENTIONABLE:
          options = new CommandNoOptionsOption(
            parameter.type,
            parameter.name,
            parameter.description,
            !(parameter.options.optional ?? false),
          );
          break;
        case ApplicationCommandOptionTypes.CHANNEL:
          options = new CommandChannelOption(
            parameter.type,
            parameter.name,
            parameter.description,
            !(parameter.options.optional ?? false),
            parameter.options.channelTypes,
          );
          break;
        case ApplicationCommandOptionTypes.INTEGER:
        case ApplicationCommandOptionTypes.NUMBER:
          if (
            parameter.options.minValue !== undefined ||
            parameter.options.maxValue !== undefined
          ) {
            options = new CommandMinMaxOption(
              parameter.type,
              parameter.name,
              parameter.description,
              !(parameter.options.optional ?? false),
              parameter.options.minValue,
              parameter.options.maxValue,
            );
            break;
          }
        // falls through
        case ApplicationCommandOptionTypes.STRING:
          if (parameter.options.choices !== undefined) {
            options = new CommandChoiceOption(
              parameter.type,
              parameter.name,
              parameter.description,
              parameter.options.choices,
              !(parameter.options.optional ?? false),
            );
            break;
          }
          options = new CommandAutocompleteOption(
            parameter.type,
            parameter.name,
            parameter.description,
            !(parameter.options.optional ?? false),
          );
          break;
      }

      parameterOptions.push(options);
    }
    return parameterOptions;
  }

  protected static toEnumType(
    type: CommandOptionParameterType,
  ): ApplicationCommandOptionTypes & CommandOptionParameterType {
    switch (type) {
      case "BOOLEAN":
      case ApplicationCommandOptionTypes.BOOLEAN:
        return ApplicationCommandOptionTypes.BOOLEAN;
      case "USER":
      case ApplicationCommandOptionTypes.USER:
        return ApplicationCommandOptionTypes.USER;
      case "ROLE":
      case ApplicationCommandOptionTypes.ROLE:
        return ApplicationCommandOptionTypes.ROLE;
      case "MENTIONABLE":
      case ApplicationCommandOptionTypes.MENTIONABLE:
        return ApplicationCommandOptionTypes.MENTIONABLE;
      case "CHANNEL":
      case ApplicationCommandOptionTypes.CHANNEL:
        return ApplicationCommandOptionTypes.CHANNEL;
      case "INTEGER":
      case ApplicationCommandOptionTypes.INTEGER:
        return ApplicationCommandOptionTypes.INTEGER;
      case "NUMBER":
      case ApplicationCommandOptionTypes.NUMBER:
        return ApplicationCommandOptionTypes.NUMBER;
      case "STRING":
      case ApplicationCommandOptionTypes.STRING:
        return ApplicationCommandOptionTypes.STRING;
    }
  }
}
