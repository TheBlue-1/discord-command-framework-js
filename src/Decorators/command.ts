/* eslint-disable @typescript-eslint/ban-types */
import { PermissionString } from 'discord.js';

import { InteractionAttribute, InteractionParameter, parameterRegister } from './parameter';

export function commandGroupRegister() {
  const commandGroupRegister: CommandGroupRegister = {};
  for (const commandGroup of Object.values(rawCommandGroupRegister)) {
    commandGroupRegister[commandGroup.name] = commandGroup;
    const commands = commandGroup.commands;
    const commandAreas = commandGroup.commandAreas;
    commandGroup.commands = {}
    commandGroup.commandAreas = {}
    for (const command of Object.values(commands)) {
      commandGroup.commands[command.name] = command;
    }
    for (const commandArea of Object.values(commandAreas)) {
      commandGroup.commandAreas[commandArea.name] = commandArea;
      const subCommands = commandArea.subCommands;
      const subCommandGroups = commandArea.subCommandGroups;
      commandArea.subCommands = {}
      commandArea.subCommandGroups = {}
      for (const subCommand of Object.values(subCommands)) {
        commandArea.subCommands[subCommand.name] = subCommand;
      }

      for (const subCommandGroup of Object.values(subCommandGroups)) {
        commandArea.subCommandGroups[subCommandGroup.name] = subCommandGroup;
        const subCommands = subCommandGroup.subCommands;
        subCommandGroup.subCommands = {}
        for (const subCommand of Object.values(subCommands)) {
          subCommandGroup.subCommands[subCommand.name] = subCommand;
        }
      }
    }
  }
  return commandGroupRegister
}
export type CommandGroupRegister = { [className: string]: CommandGroup };
export const rawCommandGroupRegister: CommandGroupRegister = {};
export const commandRegister: { [commandGroupClassName: string]: { [methodName: string]: Command } } = {
}; export const commandAreaRegister: { [commandGroupClassName: string]: { [className: string]: CommandArea } } = {
};
export function flatCommandAreaRegister(): { [className: string]: CommandArea } {
  const commandAreas: { [className: string]: CommandArea } = {}
  for (const group of Object.values(commandAreaRegister)) {
    Object.assign(commandAreas, group)
  }
  return commandAreas;
}
export const subCommandRegister: { [parentClassName: string]: { [methodName: string]: SubCommand } } = {
};
export const subCommandGroupRegister: { [commandAreaClassName: string]: { [className: string]: SubCommandGroup } } = {
};
export const targetInstanceMap: { [targetName: string]: any } = {}

export function command(name: string, description: string, options: CommandOptions = {}) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function (target: any & { constructor: Function }, propertyKey: string, descriptor: PropertyDescriptor): void {
    if (commandRegister[target.constructor.name] == undefined) commandRegister[target.constructor.name] = {}
    if (targetInstanceMap[target.constructor.name] == undefined) targetInstanceMap[target.constructor.name] = new target.constructor();
    commandRegister[target.constructor.name][propertyKey] = new Command(name, description, <Function>target[propertyKey], targetInstanceMap[target.constructor.name], options, parameterRegister[target.constructor.name][propertyKey]);
  };
}
export function subCommand(name: string, description: string, options: CommandOptions = {}) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function (target: any & { constructor: Function }, propertyKey: string, descriptor: PropertyDescriptor): void {
    if (targetInstanceMap[target.constructor.name] == undefined) targetInstanceMap[target.constructor.name] = new target.constructor();
    if (subCommandRegister[target.constructor.name] == undefined) subCommandRegister[target.constructor.name] = {}
    subCommandRegister[target.constructor.name][name] = new SubCommand(name, description, <Function>target[propertyKey], targetInstanceMap[target.constructor.name], options, parameterRegister[target.constructor.name][propertyKey]);
  };
}

export function commandGroup(name: string, options: CommandOptions = {}) {
  return function (target: new () => any): void {
    if (commandRegister[target.name] == undefined) commandRegister[target.name] = {}

    if (commandAreaRegister[target.name] == undefined) commandAreaRegister[target.name] = {}

    rawCommandGroupRegister[name] = new CommandGroup(name, options, commandRegister[target.name], commandAreaRegister[target.name]);
    setParentForChildren(rawCommandGroupRegister[name], rawCommandGroupRegister[name].commands)
    setParentForChildren(rawCommandGroupRegister[name], rawCommandGroupRegister[name].commandAreas)
  };
}
export function subCommandGroup(commandArea: new () => any, name: string, description: string, options: CommandOptions = {}) {
  return function (target: new () => any): void {
    if (subCommandGroupRegister[commandArea.name] == undefined) subCommandGroupRegister[commandArea.name] = {}

    if (subCommandRegister[target.name] == undefined) subCommandRegister[target.name] = {}
    subCommandGroupRegister[commandArea.name][name] = new SubCommandGroup(name, description, options, subCommandRegister[target.name]);
    setParentForChildren(subCommandGroupRegister[commandArea.name][name], subCommandGroupRegister[commandArea.name][name].subCommands)
    if (flatCommandAreaRegister()[commandArea.name]) subCommandGroupRegister[commandArea.name][name].setParent(flatCommandAreaRegister()[commandArea.name])
  };
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function commandArea(commandGroup: new () => any, name: string, description: string, options: CommandOptions = {}) {
  return function (target: new () => any): void {
    if (commandAreaRegister[commandGroup.name] == undefined) commandAreaRegister[commandGroup.name] = {}
    if (subCommandGroupRegister[target.name] == undefined) subCommandGroupRegister[target.name] = {}
    if (subCommandRegister[target.name] == undefined) subCommandRegister[target.name] = {}

    commandAreaRegister[commandGroup.name][name] = new CommandArea(name, description, options, subCommandRegister[target.name], subCommandGroupRegister[target.name]);
    setParentForChildren(commandAreaRegister[commandGroup.name][name], commandAreaRegister[commandGroup.name][name].subCommandGroups)
    setParentForChildren(commandAreaRegister[commandGroup.name][name], commandAreaRegister[commandGroup.name][name].subCommands)
    if (rawCommandGroupRegister[commandGroup.name]) commandAreaRegister[commandGroup.name][name].setParent(rawCommandGroupRegister[commandGroup.name])

  };
}

export function setParentForChildren(parent: Configurable, children: { [name: string]: Configurable }) {
  for (const child of Object.values(children)) {
    child.setParent(parent)
  }
}

export type CommandOptions = { access?: AccessLevel; neededPermissions?: PermissionString[]; };
export function mergeOptions(parent: CommandOptions, child: CommandOptions): CommandOptions {
  const options: CommandOptions = {}
  options.access = child.access ?? parent.access ?? "Everyone";
  options.neededPermissions = (parent.neededPermissions ?? []).concat(...(child.neededPermissions ?? []));
  return options
}

export abstract class Configurable {
  protected parent?: Configurable

  constructor(public name: string,
    protected options: CommandOptions,
  ) {
  }

  public getOptions(): CommandOptions {
    return this.parent ? mergeOptions(this.parent.getOptions(), (this.options)) : this.options;
  }

  public setParent(parent: Configurable) {
    this.parent = parent
  }
}
export abstract class DescribedConfigurable extends Configurable {
  constructor(name: string,
    public description: string,
    options: CommandOptions,) {
    super(name, options)
  }
}
export abstract class CallableCommand extends DescribedConfigurable {
  constructor(name: string,
    description: string,

    public callable: Function,
    public parentInstance: any,
    options: CommandOptions,
    public parameters: (InteractionParameter | InteractionAttribute)[]) {
    super(name, description, options)
  }
}

export class Command extends CallableCommand {
  constructor(name: string,
    description: string,
    callable: Function,
    parentInstance: any,
    options: CommandOptions,
    parameters: (InteractionParameter | InteractionAttribute)[] = []) {
    super(name, description, callable, parentInstance, options, parameters);
  }
}

export class CommandArea extends DescribedConfigurable {
  constructor(name: string,
    description: string,
    options: CommandOptions,
    public subCommands: { [name: string]: SubCommand },
    public subCommandGroups: { [name: string]: SubCommandGroup }
  ) {
    super(name, description, options)
  }
}

export class SubCommand extends CallableCommand {
  constructor(name: string,
    description: string,
    callable: Function,
    parentInstance: any,
    options: CommandOptions,
    parameters: (InteractionParameter | InteractionAttribute)[] = []) {
    super(name, description, callable, parentInstance, options, parameters);
  }
}

export class SubCommandGroup extends DescribedConfigurable {
  constructor(
    name: string,
    description: string,
    options: CommandOptions,
    public subCommands: { [name: string]: SubCommand } = {},) {
    super(name, description, options)
  }
}
export class CommandGroup extends Configurable {
  constructor(
    name: string,
    options: CommandOptions,
    public commands: { [name: string]: Command }, public commandAreas: { [name: string]: CommandArea },) {
    super(name, options)
  }
}
export type AccessLevel = "Everyone" | "GuildAdmin" | "BotAdmin";
