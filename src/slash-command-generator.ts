import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  type ApplicationCommandChannelOptionData,
  type ApplicationCommandNonOptionsData,
  type ApplicationCommandNumericOptionData,
  type ApplicationCommandOptionAllowedChannelTypes,
  type ApplicationCommandOptionChoiceData,
  type ApplicationCommandSubCommandData,
  type ApplicationCommandSubGroupData,
  type ChatInputApplicationCommandData,
  type CommandOptionChannelResolvableType,
  type CommandOptionDataTypeResolvable,
  type CommandOptionNonChoiceResolvableType,
  type CommandOptionNumericResolvableType,
  type CommandOptionSubOptionResolvableType,
} from "discord.js";
import type { ReadOnlyCommandGroupRegister } from "./Decorators/command/command.helpers";
import type {
  InteractionAttribute,
  InteractionParameter,
} from "./Decorators/parameter/parameter.types";

export class SlashCommand implements ChatInputApplicationCommandData {
  public readonly type = ApplicationCommandType.ChatInput as const;

  public constructor(
    public readonly name: string,
    public readonly description: string,
    public readonly options:
      | readonly CommandParameterOption[]
      | readonly SubCommandOptions[],
  ) {}
}

export class SubCommandGroupOption implements ApplicationCommandSubGroupData {
  public readonly type = ApplicationCommandOptionType.SubcommandGroup as const;

  public constructor(
    public readonly name: string,
    public readonly description: string,
    public readonly options: readonly SubCommandOption[],
  ) {}
}
export class SubCommandOption implements ApplicationCommandSubCommandData {
  public readonly type = ApplicationCommandOptionType.Subcommand as const;

  public constructor(
    public readonly name: string,
    public readonly description: string,
    public readonly options: readonly CommandParameterOption[],
  ) {}
}

export type CommandParameterOption =
  | CommandChannelOption
  | CommandChoiceOption<number>
  | CommandChoiceOption<string>
  | CommandMinMaxOption
  | CommandSimpleOption;
export type SubCommandOptions = SubCommandGroupOption | SubCommandOption;
export type CommandSimpleOption =
  | CommandAutocompleteOption<number>
  | CommandAutocompleteOption<string>
  | CommandNoOptionsOption;

export class CommandNoOptionsOption
  implements ApplicationCommandNonOptionsData
{
  public constructor(
    public readonly type: CommandOptionNonChoiceResolvableType,
    public readonly name: string,
    public readonly description: string,
    public readonly required: boolean,
  ) {}
}

export class CommandAutocompleteOption<T extends number | string> {
  public readonly autocomplete = true as const;

  public constructor(
    public readonly type: T extends string
      ? ApplicationCommandOptionType.String
      : CommandOptionNumericResolvableType,
    public readonly name: string,
    public readonly description: string,
    public readonly required: boolean,
  ) {
    this.autocomplete = false as true; // TODO think of something
  }
}
export class CommandChannelOption
  implements ApplicationCommandChannelOptionData
{
  public constructor(
    public readonly type: CommandOptionChannelResolvableType,
    public readonly name: string,
    public readonly description: string,
    public readonly required: boolean,
    public readonly channelTypes:
      | readonly ApplicationCommandOptionAllowedChannelTypes[]
      | undefined,
  ) {}
}

export class CommandChoiceOption<T extends number | string> {
  public constructor(
    public readonly type: T extends string
      ? ApplicationCommandOptionType.String
      : CommandOptionNumericResolvableType,
    public readonly name: string,
    public readonly description: string,
    public readonly choices: readonly CommandChoice<T>[],
    public readonly required: boolean,
  ) {}
}
export class CommandMinMaxOption
  implements ApplicationCommandNumericOptionData
{
  public constructor(
    public readonly type: CommandOptionNumericResolvableType,
    public readonly name: string,
    public readonly description: string,
    public readonly required: boolean,
    public readonly minValue: number | undefined,
    public readonly maxValue: number | undefined,
  ) {}
}
export class CommandChoice<T extends number | string>
  implements ApplicationCommandOptionChoiceData
{
  public constructor(
    public readonly name: string,
    public readonly value: T,
  ) {}
}

export type CommandOptionParameterType = Exclude<
  CommandOptionDataTypeResolvable,
  CommandOptionSubOptionResolvableType
>;

export const SlashCommandGenerator = {
  generate(groups: ReadOnlyCommandGroupRegister): SlashCommand[] {
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
    parameters: readonly (InteractionAttribute | InteractionParameter)[],
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
            options = new CommandChoiceOption<number>(
              parameter.type,
              parameter.name,
              parameter.description,
              parameter.options.choices as readonly CommandChoice<number>[], // TODO better typing
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
            options = new CommandChoiceOption<string>(
              parameter.type,
              parameter.name,
              parameter.description,
              parameter.options.choices as readonly CommandChoice<string>[], // TODO better typing
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
        case ApplicationCommandOptionType.Attachment: {
          throw new Error(
            "Not implemented yet: ApplicationCommandOptionType.Attachment case",
          );
        } // TODO implement
      }

      parameterOptions.push(options);
    }
    return parameterOptions;
  },
};
