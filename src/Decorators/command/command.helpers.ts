import {
  CommandAreaInfo,
  CommandGroupInfo,
  CommandInfo,
  Configurable,
  SubCommandGroupInfo,
  SubCommandInfo,
} from "./command.types";

export function commandGroupRegister() {
  const commandGroupRegister: CommandGroupRegister = {};
  for (const commandGroup of Object.values(rawCommandGroupRegister)) {
    commandGroupRegister[commandGroup.name] = commandGroup;
    const commands = commandGroup.commands;
    const commandAreas = commandGroup.commandAreas;
    commandGroup.commands = {};
    commandGroup.commandAreas = {};
    for (const command of Object.values(commands)) {
      commandGroup.commands[command.name] = command;
    }
    for (const commandArea of Object.values(commandAreas)) {
      commandGroup.commandAreas[commandArea.name] = commandArea;
      const subCommands = commandArea.subCommands;
      const subCommandGroups = commandArea.subCommandGroups;
      commandArea.subCommands = {};
      commandArea.subCommandGroups = {};
      for (const subCommand of Object.values(subCommands)) {
        commandArea.subCommands[subCommand.name] = subCommand;
      }

      for (const subCommandGroup of Object.values(subCommandGroups)) {
        commandArea.subCommandGroups[subCommandGroup.name] = subCommandGroup;
        const subCommands = subCommandGroup.subCommands;
        subCommandGroup.subCommands = {};
        for (const subCommand of Object.values(subCommands)) {
          subCommandGroup.subCommands[subCommand.name] = subCommand;
        }
      }
    }
  }
  return commandGroupRegister;
}
export type CommandGroupRegister = { [className: string]: CommandGroupInfo };
export const rawCommandGroupRegister: CommandGroupRegister = {};
export const commandRegister: {
  [commandGroupClassName: string]: { [methodName: string]: CommandInfo };
} = {};
export const commandAreaRegister: {
  [commandGroupClassName: string]: { [className: string]: CommandAreaInfo };
} = {};
export function flatCommandAreaRegister(): {
  [className: string]: CommandAreaInfo;
} {
  const commandAreas: { [className: string]: CommandAreaInfo } = {};
  for (const group of Object.values(commandAreaRegister)) {
    Object.assign(commandAreas, group);
  }
  return commandAreas;
}
export const subCommandRegister: {
  [parentClassName: string]: { [methodName: string]: SubCommandInfo };
} = {};
export const subCommandGroupRegister: {
  [commandAreaClassName: string]: { [className: string]: SubCommandGroupInfo };
} = {};
export const targetInstanceMap: { [targetName: string]: any } = {};

export function setParentForChildren(
  parent: Configurable,
  children: { [name: string]: Configurable }
) {
  for (const child of Object.values(children)) {
    child.setParent(parent);
  }
}
