import type { CommandInteraction } from "discord.js";
import { ApplicationCommandOptionTypes } from "discord.js/typings/enums";
import type { CommandGroupRegister } from "./Decorators/command/command.helpers";
import type {
  CommandAreaInfo,
  CommandInfo,
  SubCommandInfo,
} from "./Decorators/command/command.types";
import type { ErrorHandlingObservable } from "./error-handling";

export class Interpreter {
  protected commandAreas: Record<string, CommandAreaInfo> = {};
  protected commands: Record<string, CommandInfo> = {};

  public constructor(
    commandInteraction$: ErrorHandlingObservable<CommandInteraction>,
    commandGroups: CommandGroupRegister,
  ) {
    commandInteraction$.subscribe(async (interaction) => {
      await this.callCommand(interaction);
    });
    for (const group of Object.values(commandGroups)) {
      Object.assign(this.commandAreas, group.commandAreas);
      Object.assign(this.commands, group.commands);
    }
  }

  public async callCommand(interaction: CommandInteraction) {
    const command = this.findCommand(interaction);
    if (!command) {
      interaction.reply("command not found");
      return;
    }
    const options = command.getOptions();

    // TODO

    const parameters = this.prepareParameters(command, interaction);

    await interaction.reply("command is being executed...");
    // TODO multiple replies
    await interaction.editReply(
      `${command.callable.bind(command.parentInstance, ...parameters)()}`,
    );
  }

  protected findCommand(
    interaction: CommandInteraction,
  ): CommandInfo | SubCommandInfo | undefined {
    if (interaction.options.getSubcommand(false) === null) {
      return this.commands[interaction.commandName];
    }
    if (interaction.options.getSubcommandGroup(false) === null) {
      return this.commandAreas[interaction.commandName].subCommands[
        interaction.options.getSubcommand()
      ];
    }
    return this.commandAreas[interaction.commandName].subCommandGroups[
      interaction.options.getSubcommandGroup()
    ].subCommands[interaction.options.getSubcommand()];
  }

  protected static prepareParameters(
    command: CommandInfo | SubCommandInfo,
    interaction: CommandInteraction,
  ): unknown[] {
    const params: unknown[] = [];
    for (const parameter of command.parameters) {
      if (parameter.methodParameterType === "attribute") {
        params.push(interaction[parameter.name]);
        continue;
      }

      switch (parameter.type) {
        case ApplicationCommandOptionTypes.BOOLEAN:
          params.push(
            interaction.options.getBoolean(
              parameter.name,
              !(parameter.options.optional ?? false),
            ),
          );
          continue;
        case ApplicationCommandOptionTypes.USER:
          params.push(
            interaction.options.getUser(
              parameter.name,
              !(parameter.options.optional ?? false),
            ),
          );
          continue;
        case ApplicationCommandOptionTypes.ROLE:
          params.push(
            interaction.options.getRole(
              parameter.name,
              !(parameter.options.optional ?? false),
            ),
          );
          continue;
        case ApplicationCommandOptionTypes.MENTIONABLE:
          params.push(
            interaction.options.getMentionable(
              parameter.name,
              !(parameter.options.optional ?? false),
            ),
          );
          continue;
        case ApplicationCommandOptionTypes.CHANNEL:
          params.push(
            interaction.options.getChannel(
              parameter.name,
              !(parameter.options.optional ?? false),
            ),
          );
          continue;
        case ApplicationCommandOptionTypes.INTEGER:
          params.push(
            interaction.options.getInteger(
              parameter.name,
              !(parameter.options.optional ?? false),
            ),
          );
          continue;
        case ApplicationCommandOptionTypes.NUMBER:
          params.push(
            interaction.options.getNumber(
              parameter.name,
              !(parameter.options.optional ?? false),
            ),
          );
          continue;
        case ApplicationCommandOptionTypes.STRING:
          params.push(
            interaction.options.getString(
              parameter.name,
              !(parameter.options.optional ?? false),
            ),
          );
      }
      if (
        params[params.length - 1] === undefined &&
        parameter.options.defaultValue !== undefined
      ) {
        params[params.length - 1] = parameter.options.defaultValue;
      }
    }

    return params;
  }
}
