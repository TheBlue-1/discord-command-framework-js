import {
  ApplicationCommand,
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
  ChannelTypes,
} from "discord.js/typings/enums";

import { CommandGroupRegister } from "./Decorators/command/command.decorators";
import {
  InteractionAttribute,
  InteractionParameter,
} from "./Decorators/parameter/parameter.decorators";

export class SlashCommandGenerator {
  public generate(groups: CommandGroupRegister): SlashCommand[] {
    const slashCommands: SlashCommand[] = [];
    for (const group of Object.values(groups)) {
      for (const command of Object.values(group.commands)) {
        const parameterOptions = this.getCommandParameterOptions(
          command.parameters
        );
        slashCommands.push(
          new SlashCommand(command.name, command.description, parameterOptions)
        );
      }
      for (const commandArea of Object.values(group.commandAreas)) {
        const subCommandOptions: SubCommandOptions[] = [];

        for (const subCommand of Object.values(commandArea.subCommands)) {
          const parameterOptions = this.getCommandParameterOptions(
            subCommand.parameters
          );

          subCommandOptions.push(
            new SubCommandOption(
              subCommand.name,
              subCommand.description,
              parameterOptions
            )
          );
        }

        for (const subCommandGroup of Object.values(
          commandArea.subCommandGroups
        )) {
          const innerSubCommandOptions: SubCommandOption[] = [];
          for (const subCommand of Object.values(subCommandGroup.subCommands)) {
            const parameterOptions = this.getCommandParameterOptions(
              subCommand.parameters
            );

            innerSubCommandOptions.push(
              new SubCommandOption(
                subCommand.name,
                subCommand.description,
                parameterOptions
              )
            );
          }
          subCommandOptions.push(
            new SubCommandGroupOption(
              subCommandGroup.name,
              subCommandGroup.description,
              innerSubCommandOptions
            )
          );
        }
        slashCommands.push(
          new SlashCommand(
            commandArea.name,
            commandArea.description,
            subCommandOptions
          )
        );
      }
    }
    return slashCommands;
  }

  protected getCommandParameterOptions(
    parameters: (InteractionParameter | InteractionAttribute)[]
  ): CommandParameterOption[] {
    const parameterOptions: CommandParameterOption[] = [];
    for (const parameter of parameters) {
      if (parameter.methodParameterType == "attribute") {
        continue;
      }

      let options: CommandParameterOption;
      parameter.type = this.toEnumType(parameter.type);
      switch (parameter.type) {
        case ApplicationCommandOptionTypes.BOOLEAN:
        case ApplicationCommandOptionTypes.USER:
        case ApplicationCommandOptionTypes.ROLE:
        case ApplicationCommandOptionTypes.MENTIONABLE:
          options = new CommandNoOptionsOption(
            parameter.type,
            parameter.name,
            parameter.description,
            !parameter.options.optional
          );
          break;
        case ApplicationCommandOptionTypes.CHANNEL:
          options = new CommandChannelOption(
            parameter.type,
            parameter.name,
            parameter.description,
            !parameter.options.optional,
            parameter.options.channelTypes
          );
          break;
        case ApplicationCommandOptionTypes.INTEGER:
        case ApplicationCommandOptionTypes.NUMBER:
          if (
            parameter.options.minValue != undefined ||
            parameter.options.maxValue != undefined
          ) {
            options = new CommandMinMaxOption(
              parameter.type,
              parameter.name,
              parameter.description,
              !parameter.options.optional,
              parameter.options.minValue,
              parameter.options.maxValue
            );
            break;
          }
        // falls through
        case ApplicationCommandOptionTypes.STRING:
          if (parameter.options.choices != undefined) {
            options = new CommandChoiceOption(
              parameter.type,
              parameter.name,
              parameter.description,
              parameter.options.choices,
              !parameter.options.optional
            );
            break;
          }
          options = new CommandAutocompleteOption(
            parameter.type,
            parameter.name,
            parameter.description,
            !parameter.options.optional
          );
          break;
      }

      parameterOptions.push(options);
    }
    return parameterOptions;
  }

  protected toEnumType(
    type: CommandOptionParameterType
  ): ApplicationCommandOptionTypes & CommandOptionParameterType {
    switch (type) {
      case "BOOLEAN":
        return ApplicationCommandOptionTypes.BOOLEAN;
      case "USER":
        return ApplicationCommandOptionTypes.USER;
      case "ROLE":
        return ApplicationCommandOptionTypes.ROLE;
      case "MENTIONABLE":
        return ApplicationCommandOptionTypes.MENTIONABLE;
      case "CHANNEL":
        return ApplicationCommandOptionTypes.CHANNEL;
      case "INTEGER":
        return ApplicationCommandOptionTypes.INTEGER;
      case "NUMBER":
        return ApplicationCommandOptionTypes.NUMBER;
      case "STRING":
        return ApplicationCommandOptionTypes.STRING;
    }
  }
}

export class SlashCommand implements ChatInputApplicationCommandData {
  public type: "CHAT_INPUT" | ApplicationCommandTypes.CHAT_INPUT =
    ApplicationCommandTypes.CHAT_INPUT;

  constructor(
    public name: string,
    public description: string,
    public options: CommandParameterOption[] | SubCommandOptions[]
  ) {}

  public deepEquals(other: ApplicationCommand): boolean {
    if (other.name != this.name) return false;
    if (other.type != "CHAT_INPUT") return false;
    if (other.description != this.description) return false;
    if (other.options.length != this.options.length) return false;
    for (let i = 0; i < this.options.length; i++) {
      if (!this.options[i].deepEquals(other.options[i])) return false;
    }
    return true;
  }
}

export class SubCommandGroupOption
  implements ApplicationCommandSubGroupData, DeepEqualsOption
{
  public type:
    | "SUB_COMMAND_GROUP"
    | ApplicationCommandOptionTypes.SUB_COMMAND_GROUP =
    ApplicationCommandOptionTypes.SUB_COMMAND_GROUP;

  constructor(
    public name: string,
    public description: string,
    public options: SubCommandOption[]
  ) {}

  public deepEquals(other: ApplicationCommandOption): boolean {
    if (other.name != this.name) return false;
    if (other.type != "SUB_COMMAND_GROUP") return false;
    if (other.description != this.description) return false;
    if (other.options.length != this.options.length) return false;
    for (let i = 0; i < this.options.length; i++) {
      if (!this.options[i].deepEquals(other.options[i])) return false;
    }
    return true;
  }
}
export class SubCommandOption
  implements ApplicationCommandSubCommandData, DeepEqualsOption
{
  public type: "SUB_COMMAND" | ApplicationCommandOptionTypes.SUB_COMMAND =
    ApplicationCommandOptionTypes.SUB_COMMAND;

  constructor(
    public name: string,
    public description: string,
    public options: CommandParameterOption[]
  ) {}

  public deepEquals(other: ApplicationCommandOption): boolean {
    if (other.name != this.name) return false;
    if (other.type != "SUB_COMMAND") return false;
    if (other.description != this.description) return false;
    if (other.options.length != this.options.length) return false;
    for (let i = 0; i < this.options.length; i++) {
      if (!this.options[i].deepEquals(other.options[i])) return false;
    }
    return true;
  }
}

export type CommandParameterOption =
  | CommandSimpleOption
  | CommandChoiceOption
  | CommandChannelOption
  | CommandMinMaxOption;
export type SubCommandOptions = SubCommandOption | SubCommandGroupOption;
export type CommandSimpleOption =
  | CommandNoOptionsOption
  | CommandAutocompleteOption;

export class CommandNoOptionsOption
  implements ApplicationCommandNonOptionsData, DeepEqualsOption
{
  constructor(
    public type: CommandOptionNonChoiceResolvableType,
    public name: string,
    public description: string,
    public required: boolean
  ) {}

  public deepEquals(other: ApplicationCommandOption): boolean {
    if (other.name != this.name) return false;
    if (other.type != this.type) return false;
    if (other.description != this.description) return false;
    if (other.required != this.required) return false;
    return true;
  }
}

export class CommandAutocompleteOption
  implements ApplicationCommandAutocompleteOption, DeepEqualsOption
{
  public autocomplete: true = true;

  constructor(
    public type:
      | "STRING"
      | "NUMBER"
      | "INTEGER"
      | ApplicationCommandOptionTypes.STRING
      | ApplicationCommandOptionTypes.NUMBER
      | ApplicationCommandOptionTypes.INTEGER,
    public name: string,
    public description: string,
    public required: boolean
  ) {
    this.autocomplete = <true>false; //TODO think of something
  }

  public deepEquals(other: ApplicationCommandOption): boolean {
    if (other.name != this.name) return false;
    if (other.type != this.type) return false;
    if (other.description != this.description) return false;
    if (other.required != this.required) return false;
    if (<boolean>other.autocomplete != this.autocomplete) return false;

    return true;
  }
}
export class CommandChannelOption
  implements ApplicationCommandChannelOptionData, DeepEqualsOption
{
  constructor(
    public type: CommandOptionChannelResolvableType,
    public name: string,
    public description: string,
    public required: boolean,
    public channelTypes: ExcludeEnum<typeof ChannelTypes, "UNKNOWN">[]
  ) {}

  public deepEquals(other: ApplicationCommandOption): boolean {
    if (other.name != this.name) return false;
    if (other.type != this.type) return false;
    if (other.description != this.description) return false;
    if (other.required != this.required) return false;
    if (other.channelTypes != this.channelTypes) return false;

    return true;
  }
}

export class CommandChoiceOption
  implements ApplicationCommandChoicesData, DeepEqualsOption
{
  constructor(
    public type: CommandOptionChoiceResolvableType,
    public name: string,
    public description: string,
    public choices: CommandChoice<string | number>[],
    public required: boolean
  ) {}

  public deepEquals(other: ApplicationCommandOption): boolean {
    if (other.name != this.name) return false;
    if (other.type != this.type) return false;
    if (other.description != this.description) return false;
    if (other.required != this.required) return false;
    if (other.choices.length != this.choices.length) return false;
    for (let i = 0; i < this.choices.length; i++) {
      if (this.choices[i].name != other.choices[i].name) return false;
      if (this.choices[i].value != other.choices[i].value) return false;
    }
    return true;
  }
}
export class CommandMinMaxOption
  implements ApplicationCommandNumericOptionData, DeepEqualsOption
{
  constructor(
    public type: CommandOptionNumericResolvableType,
    public name: string,
    public description: string,
    public required: boolean,
    public minValue: number,
    public maxValue: number
  ) {}

  public deepEquals(other: ApplicationCommandOption): boolean {
    if (other.name != this.name) return false;
    if (other.type != this.type) return false;
    if (other.description != this.description) return false;
    if (other.required != this.required) return false;
    if ((<ApplicationCommandNumericOption>other).minValue != this.minValue)
      return false;
    if ((<ApplicationCommandNumericOption>other).maxValue != this.maxValue)
      return false;

    return true;
  }
}
export class CommandChoice<T extends string | number>
  implements ApplicationCommandOptionChoice
{
  constructor(public name: string, public value: T) {}
}
export type CommandOptionParameterType = Exclude<
  CommandOptionDataTypeResolvable,
  CommandOptionSubOptionResolvableType
>;
export type DeepEqualsOption = {
  deepEquals: (other: ApplicationCommandOption) => boolean;
};
