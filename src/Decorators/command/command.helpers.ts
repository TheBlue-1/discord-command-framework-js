import type {
  CommandAreaInfo,
  CommandGroupInfo,
  CommandInfo,
  Configurable,
  SubCommandGroupInfo,
  SubCommandInfo,
} from "./command.types";

export type CommandGroupRegister = Record<string, CommandGroupInfo>;
export type ReadOnlyCommandGroupRegister = Readonly<
  Record<string, Readonly<CommandGroupInfo>>
>;

export const rawCommandGroupRegister: CommandGroupRegister = {};
export const commandRegister: Record<string, Record<string, CommandInfo>> = {};
export const commandAreaRegister: Record<
  string,
  Record<string, CommandAreaInfo>
> = {};

export function commandGroupRegister() {
  const register: CommandGroupRegister = {};
  for (const commandGroup of Object.values(rawCommandGroupRegister)) {
    register[commandGroup.name] = commandGroup;
    const { commands } = commandGroup;
    const { commandAreas } = commandGroup;
    commandGroup.commands = {};
    commandGroup.commandAreas = {};
    for (const command of Object.values(commands)) {
      commandGroup.commands[command.name] = command;
    }
    for (const commandArea of Object.values(commandAreas)) {
      commandGroup.commandAreas[commandArea.name] = commandArea;
      const { subCommands } = commandArea;
      const { subCommandGroups } = commandArea;
      commandArea.subCommands = {};
      commandArea.subCommandGroups = {};
      for (const subCommand of Object.values(subCommands)) {
        commandArea.subCommands[subCommand.name] = subCommand;
      }

      for (const subCommandGroup of Object.values(subCommandGroups)) {
        commandArea.subCommandGroups[subCommandGroup.name] = subCommandGroup;
        const groupSubCommands = subCommandGroup.subCommands;
        subCommandGroup.subCommands = {};
        for (const subCommand of Object.values(groupSubCommands)) {
          subCommandGroup.subCommands[subCommand.name] = subCommand;
        }
      }
    }
  }
  return register;
}

export function flatCommandAreaRegister(): Record<string, CommandAreaInfo> {
  const commandAreas: Record<string, CommandAreaInfo> = {};
  for (const group of Object.values(commandAreaRegister)) {
    Object.assign(commandAreas, group);
  }
  return commandAreas;
}
export const subCommandRegister: Record<
  string,
  Record<string, SubCommandInfo>
> = {};
export const subCommandGroupRegister: Record<
  string,
  Record<string, SubCommandGroupInfo>
> = {};
export const targetInstanceMap: Record<string, unknown> = {};

export function setParentForChildren(
  parent: Readonly<Configurable>,
  children: Readonly<Record<string, Readonly<Configurable>>>,
) {
  for (const child of Object.values(children)) {
    child.setParent(parent);
  }
}
