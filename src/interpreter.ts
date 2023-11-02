import {
  ApplicationCommandOptionType,
  type ChatInputCommandInteraction,
} from "discord.js";
import type { ReadOnlyCommandGroupRegister } from "./Decorators/command/command.helpers";
import type {
  CommandAreaInfo,
  CommandInfo,
  SubCommandInfo,
} from "./Decorators/command/command.types";
import type { ErrorHandlingObservable } from "./error-handling";
import type { DeepReadonly } from "./types";

export class Interpreter {
  protected commandAreas: Record<string, CommandAreaInfo> = {};
  protected commands: Record<string, CommandInfo> = {};

  public constructor(
    commandInteraction$: DeepReadonly<
      ErrorHandlingObservable<DeepReadonly<ChatInputCommandInteraction>>
    >,
    commandGroups: ReadOnlyCommandGroupRegister,
  ) {
    commandInteraction$.subscribe(async (interaction) => {
      await this.callCommand(interaction);
    });
    console.log(commandGroups);
    for (const group of Object.values(commandGroups)) {
      Object.assign(this.commandAreas, group.commandAreas);
      Object.assign(this.commands, group.commands);
    }
  }

  public async callCommand(
    interaction: DeepReadonly<ChatInputCommandInteraction>,
  ) {
    const command = this.findCommand(interaction);
    if (!command) {
      await interaction.reply("command not found");
      return;
    }
    // const options = command.getOptions();

    // TODO (guess: use options)

    const parameters = Interpreter.prepareParameters(command, interaction);

    await interaction.reply("command is being executed...");
    // TODO multiple replies
    await interaction.editReply(
      `${
        (
          await command.callable.bind(command.parentInstance, ...parameters)()
        )?.toString() ?? "command was executed"
      }`,
    );
  }

  protected findCommand(
    interaction: DeepReadonly<ChatInputCommandInteraction>,
  ): CommandInfo | Readonly<SubCommandInfo> | undefined {
    if (interaction.options.getSubcommand(false) === null) {
      return this.commands[interaction.commandName];
    }
    const commandArea = this.commandAreas[interaction.commandName];
    if (interaction.options.getSubcommandGroup(false) === null) {
      return commandArea?.subCommands[interaction.options.getSubcommand(true)];
    }
    const subCommandGroup =
      commandArea?.subCommandGroups[
        interaction.options.getSubcommandGroup(true)
      ];
    return subCommandGroup?.subCommands[
      interaction.options.getSubcommand(true)
    ];
  }

  protected static prepareParameters(
    command: Readonly<CommandInfo | SubCommandInfo>,
    interaction: DeepReadonly<ChatInputCommandInteraction>,
  ): unknown[] {
    const params: unknown[] = [];
    for (const parameter of command.parameters) {
      if (parameter.methodParameterType === "attribute") {
        params.push(interaction[parameter.name]);
        continue;
      }

      const required = !(parameter.options.optional ?? false);

      switch (parameter.type) {
        case ApplicationCommandOptionType.Boolean:
          params.push(interaction.options.getBoolean(parameter.name, required));
          break;
        case ApplicationCommandOptionType.User:
          params.push(interaction.options.getUser(parameter.name, required));
          break;
        case ApplicationCommandOptionType.Role:
          params.push(interaction.options.getRole(parameter.name, required));
          break;
        case ApplicationCommandOptionType.Mentionable:
          params.push(
            interaction.options.getMentionable(parameter.name, required),
          );
          break;
        case ApplicationCommandOptionType.Channel:
          params.push(interaction.options.getChannel(parameter.name, required));
          break;
        case ApplicationCommandOptionType.Integer:
          params.push(interaction.options.getInteger(parameter.name, required));
          break;
        case ApplicationCommandOptionType.Number:
          params.push(interaction.options.getNumber(parameter.name, required));
          break;
        case ApplicationCommandOptionType.String:
          params.push(interaction.options.getString(parameter.name, required));
          break;
        case ApplicationCommandOptionType.Attachment: {
          throw new Error(
            "Not implemented yet: ApplicationCommandOptionType.Attachment case",
          );
        }
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
