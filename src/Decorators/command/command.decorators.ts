/* eslint-disable @typescript-eslint/ban-types */
import { parameterRegister } from "../parameter/parameter.helpers";
import {
  commandRegister,
  targetInstanceMap,
  subCommandRegister,
  commandAreaRegister,
  rawCommandGroupRegister,
  setParentForChildren,
  subCommandGroupRegister,
  flatCommandAreaRegister,
} from "./command.helpers";
import {
  CommandOptions,
  Command,
  SubCommand,
  CommandGroup,
  SubCommandGroup,
  CommandArea,
} from "./command.types";

export function command(
  name: string,
  description: string,
  options: CommandOptions = {}
) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function (
    target: any & { constructor: Function },
    propertyKey: string,
    descriptor: PropertyDescriptor
  ): void {
    if (commandRegister[target.constructor.name] == undefined)
      commandRegister[target.constructor.name] = {};
    if (targetInstanceMap[target.constructor.name] == undefined)
      targetInstanceMap[target.constructor.name] = new target.constructor();
    commandRegister[target.constructor.name][propertyKey] = new Command(
      name,
      description,
      <Function>target[propertyKey],
      targetInstanceMap[target.constructor.name],
      options,
      parameterRegister[target.constructor.name][propertyKey]
    );
  };
}
export function subCommand(
  name: string,
  description: string,
  options: CommandOptions = {}
) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function (
    target: any & { constructor: Function },
    propertyKey: string,
    descriptor: PropertyDescriptor
  ): void {
    if (targetInstanceMap[target.constructor.name] == undefined)
      targetInstanceMap[target.constructor.name] = new target.constructor();
    if (subCommandRegister[target.constructor.name] == undefined)
      subCommandRegister[target.constructor.name] = {};
    subCommandRegister[target.constructor.name][name] = new SubCommand(
      name,
      description,
      <Function>target[propertyKey],
      targetInstanceMap[target.constructor.name],
      options,
      parameterRegister[target.constructor.name][propertyKey]
    );
  };
}

export function commandGroup(name: string, options: CommandOptions = {}) {
  return function (target: new () => any): void {
    if (commandRegister[target.name] == undefined)
      commandRegister[target.name] = {};

    if (commandAreaRegister[target.name] == undefined)
      commandAreaRegister[target.name] = {};

    rawCommandGroupRegister[name] = new CommandGroup(
      name,
      options,
      commandRegister[target.name],
      commandAreaRegister[target.name]
    );
    setParentForChildren(
      rawCommandGroupRegister[name],
      rawCommandGroupRegister[name].commands
    );
    setParentForChildren(
      rawCommandGroupRegister[name],
      rawCommandGroupRegister[name].commandAreas
    );
  };
}
export function subCommandGroup(
  commandArea: new () => any,
  name: string,
  description: string,
  options: CommandOptions = {}
) {
  return function (target: new () => any): void {
    if (subCommandGroupRegister[commandArea.name] == undefined)
      subCommandGroupRegister[commandArea.name] = {};

    if (subCommandRegister[target.name] == undefined)
      subCommandRegister[target.name] = {};
    subCommandGroupRegister[commandArea.name][name] = new SubCommandGroup(
      name,
      description,
      options,
      subCommandRegister[target.name]
    );
    setParentForChildren(
      subCommandGroupRegister[commandArea.name][name],
      subCommandGroupRegister[commandArea.name][name].subCommands
    );
    if (flatCommandAreaRegister()[commandArea.name])
      subCommandGroupRegister[commandArea.name][name].setParent(
        flatCommandAreaRegister()[commandArea.name]
      );
  };
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function commandArea(
  commandGroup: new () => any,
  name: string,
  description: string,
  options: CommandOptions = {}
) {
  return function (target: new () => any): void {
    if (commandAreaRegister[commandGroup.name] == undefined)
      commandAreaRegister[commandGroup.name] = {};
    if (subCommandGroupRegister[target.name] == undefined)
      subCommandGroupRegister[target.name] = {};
    if (subCommandRegister[target.name] == undefined)
      subCommandRegister[target.name] = {};

    commandAreaRegister[commandGroup.name][name] = new CommandArea(
      name,
      description,
      options,
      subCommandRegister[target.name],
      subCommandGroupRegister[target.name]
    );
    setParentForChildren(
      commandAreaRegister[commandGroup.name][name],
      commandAreaRegister[commandGroup.name][name].subCommandGroups
    );
    setParentForChildren(
      commandAreaRegister[commandGroup.name][name],
      commandAreaRegister[commandGroup.name][name].subCommands
    );
    if (rawCommandGroupRegister[commandGroup.name])
      commandAreaRegister[commandGroup.name][name].setParent(
        rawCommandGroupRegister[commandGroup.name]
      );
  };
}
