import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  type ApplicationCommandAutocompleteStringOption,
  type ApplicationCommandChannelOptionData,
  type ApplicationCommandChoicesData,
  type ApplicationCommandNonOptionsData,
  type ApplicationCommandNumericOptionData,
  type ApplicationCommandOptionChoiceData,
  type ApplicationCommandSubCommandData,
  type ApplicationCommandSubGroupData,
  type ChannelType,
  type ChatInputApplicationCommandData,
  type CommandOptionChannelResolvableType,
  type CommandOptionChoiceResolvableType,
  type CommandOptionDataTypeResolvable,
  type CommandOptionNonChoiceResolvableType,
  type CommandOptionNumericResolvableType,
  type CommandOptionSubOptionResolvableType,
} from "discord.js";
import type { CommandGroupRegister } from "./Decorators/command/command.helpers";
import type {
  InteractionAttribute,
  InteractionParameter,
} from "./Decorators/parameter/parameter.types";

export class SlashCommand implements ChatInputApplicationCommandData {
  public type = ApplicationCommandType.ChatInput as const;

  public constructor(
    public name: string,
    public description: string,
    public options: CommandParameterOption[] | SubCommandOptions[],
  ) {}
}

export class SubCommandGroupOption implements ApplicationCommandSubGroupData {
  public type = ApplicationCommandOptionType.SubcommandGroup as const;

  public constructor(
    public name: string,
    public description: string,
    public options: SubCommandOption[],
  ) {}
}
export class SubCommandOption implements ApplicationCommandSubCommandData {
  public type = ApplicationCommandOptionType.Subcommand as const;

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
  implements ApplicationCommandNonOptionsData
{
  public constructor(
    public type: CommandOptionNonChoiceResolvableType,
    public name: string,
    public description: string,
    public required: boolean,
  ) {}
}

export class CommandAutocompleteOption
  implements ApplicationCommandAutocompleteStringOption
{
  public autocomplete = true as const;

  public constructor(
    public type: ApplicationCommandOptionType.String,
    public name: string,
    public description: string,
    public required: boolean,
  ) {
    this.autocomplete = false as true; // TODO think of something
  }
}
export class CommandChannelOption
  implements ApplicationCommandChannelOptionData
{
  public constructor(
    public type: CommandOptionChannelResolvableType,
    public name: string,
    public description: string,
    public required: boolean,
    public channelTypes: ChannelType[] | undefined,
  ) {}
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
  implements ApplicationCommandNumericOptionData
{
  public constructor(
    public type: CommandOptionNumericResolvableType,
    public name: string,
    public description: string,
    public required: boolean,
    public minValue: number | undefined,
    public maxValue: number | undefined,
  ) {}
}
export class CommandChoice<T extends number | string>
  implements ApplicationCommandOptionChoiceData
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

export const SlashCommandGenerator = {
  generate(groups: CommandGroupRegister): SlashCommand[] {
    const slashCommands: SlashCommand[] = [];
    for (const group of Object.values(groups)) {
      for (const command of Object.values(group.commands)) {
        const parameterOptions =
          SlashCommandGenerator.getCommandParameterOptions(command.parameters);
        slashCommands.push(
          new SlashCommand(command.name, command.description, parameterOptions),
        );
      }
      for (const commandArea of Object.values(group.commandAreas)) {
        const subCommandOptions: SubCommandOptions[] = [];

        for (const subCommand of Object.values(commandArea.subCommands)) {
          const parameterOptions =
            SlashCommandGenerator.getCommandParameterOptions(
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
            const parameterOptions =
              SlashCommandGenerator.getCommandParameterOptions(
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
  },

  getCommandParameterOptions(
    parameters: (InteractionAttribute | InteractionParameter)[],
  ): CommandParameterOption[] {
    const parameterOptions: CommandParameterOption[] = [];
    for (const parameter of parameters) {
      if (parameter.methodParameterType === "attribute") {
        continue;
      }

      let options: CommandParameterOption;
      switch (parameter.type) {
        case ApplicationCommandOptionType.Boolean:
        case ApplicationCommandOptionType.User:
        case ApplicationCommandOptionType.Role:
        case ApplicationCommandOptionType.Mentionable:
          options = new CommandNoOptionsOption(
            parameter.type,
            parameter.name,
            parameter.description,
            !(parameter.options.optional ?? false),
          );
          break;
        case ApplicationCommandOptionType.Channel:
          options = new CommandChannelOption(
            parameter.type,
            parameter.name,
            parameter.description,
            !(parameter.options.optional ?? false),
            parameter.options.channelTypes,
          );
          break;
        case ApplicationCommandOptionType.Integer:
        case ApplicationCommandOptionType.Number:
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
        case ApplicationCommandOptionType.String:
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
  },
};
