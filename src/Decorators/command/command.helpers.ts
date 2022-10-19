import {
  CommandGroup,
  Command,
  CommandArea,
  SubCommand,
  SubCommandGroup,
  Configurable,
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
export type CommandGroupRegister = { [className: string]: CommandGroup };
export const rawCommandGroupRegister: CommandGroupRegister = {};
export const commandRegister: {
  [commandGroupClassName: string]: { [methodName: string]: Command };
} = {};
export const commandAreaRegister: {
  [commandGroupClassName: string]: { [className: string]: CommandArea };
} = {};
export function flatCommandAreaRegister(): {
  [className: string]: CommandArea;
} {
  const commandAreas: { [className: string]: CommandArea } = {};
  for (const group of Object.values(commandAreaRegister)) {
    Object.assign(commandAreas, group);
  }
  return commandAreas;
}
export const subCommandRegister: {
  [parentClassName: string]: { [methodName: string]: SubCommand };
} = {};
export const subCommandGroupRegister: {
  [commandAreaClassName: string]: { [className: string]: SubCommandGroup };
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
