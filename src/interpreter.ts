import { CommandInteraction } from 'discord.js';
import { ApplicationCommandOptionTypes } from 'discord.js/typings/enums';
import { Observable } from 'rxjs';

import { Command, CommandArea, CommandGroupRegister, SubCommand } from './Decorators/command';

export class Interpreter {
    protected commandAreas: { [name: string]: CommandArea } = {}

    protected commands: { [name: string]: Command } = {}

    constructor(private commandInteraction$: Observable<CommandInteraction>, commandGroups: CommandGroupRegister) {
        commandInteraction$.subscribe(interaction => {
            this.callCommand(interaction)
        });
        for (const group of Object.values(commandGroups)) {
            Object.assign(this.commandAreas, group.commandAreas)
            Object.assign(this.commands, group.commands)
        }
    }

    public callCommand(interaction: CommandInteraction): void {
        const command = this.findCommand(interaction);
        if (!command) {
            interaction.reply("command not found");
            return
        }
        const options = command.getOptions();

        //TODO

        const parameters = this.prepareParameters(command, interaction)

        interaction.reply("" + command.callable.bind(command.parentInstance, ...parameters)())

        return;
    }

    protected findCommand(interaction: CommandInteraction): Command | SubCommand {
        if (!interaction.options.getSubcommand(false)) {
            return this.commands[interaction.commandName]
        }
        if (!interaction.options.getSubcommandGroup(false)) {
            return this.commandAreas[interaction.commandName].subCommands[interaction.options.getSubcommand()]
        }
        return this.commandAreas[interaction.commandName].subCommandGroups[interaction.options.getSubcommandGroup()].subCommands[interaction.options.getSubcommand()]
    }

    protected prepareParameters(command: Command | SubCommand, interaction: CommandInteraction): any[] {
        const params: any[] = [];
        for (const parameter of command.parameters) {
            if (parameter.methodParameterType == "attribute") {
                params.push(interaction[parameter.name])
                continue
            }

            switch (parameter.type) {
                case ApplicationCommandOptionTypes.BOOLEAN:
                    params.push(interaction.options.getBoolean(parameter.name, !parameter.options.optional))
                    continue
                case ApplicationCommandOptionTypes.USER:
                    params.push(interaction.options.getUser(parameter.name, !parameter.options.optional))
                    continue
                case ApplicationCommandOptionTypes.ROLE:
                    params.push(interaction.options.getRole(parameter.name, !parameter.options.optional))
                    continue
                case ApplicationCommandOptionTypes.MENTIONABLE:
                    params.push(interaction.options.getMentionable(parameter.name, !parameter.options.optional))
                    continue
                case ApplicationCommandOptionTypes.CHANNEL:
                    params.push(interaction.options.getChannel(parameter.name, !parameter.options.optional))
                    continue
                case ApplicationCommandOptionTypes.INTEGER:
                    params.push(interaction.options.getInteger(parameter.name, !parameter.options.optional))
                    continue
                case ApplicationCommandOptionTypes.NUMBER:
                    params.push(interaction.options.getNumber(parameter.name, !parameter.options.optional))
                    continue
                case ApplicationCommandOptionTypes.STRING:
                    params.push(interaction.options.getString(parameter.name, !parameter.options.optional))
            }
        }

        return params;
    }
}