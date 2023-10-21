import { parameterRegister } from "../parameter/parameter.helpers";
import {
  commandAreaRegister,
  commandRegister,
  flatCommandAreaRegister,
  rawCommandGroupRegister,
  setParentForChildren,
  subCommandGroupRegister,
  subCommandRegister,
  targetInstanceMap,
} from "./command.helpers";
import {
  CommandAreaInfo,
  CommandGroupInfo,
  CommandInfo,
  SubCommandGroupInfo,
  SubCommandInfo,
  type CommandOptions,
} from "./command.types";

export function Command(
  name: string,
  description: string,
  options: CommandOptions = {},
) {
  return function (
    target: { constructor: new () => void },
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ): void {
    const command = commandRegister[target.constructor.name] ?? {};
    if (commandRegister[target.constructor.name] === undefined) {
      commandRegister[target.constructor.name] = command;
    }
    const targetInstance =
      targetInstanceMap[target.constructor.name] ?? new target.constructor();
    if (targetInstanceMap[target.constructor.name] === undefined) {
      targetInstanceMap[target.constructor.name] = targetInstance;
    }
    command[propertyKey] = new CommandInfo(
      name,
      description,
      target[propertyKey],
      targetInstanceMap[target.constructor.name],
      options,
      parameterRegister[target.constructor.name][propertyKey],
    );
  };
}
export function SubCommand(
  name: string,
  description: string,
  options: CommandOptions = {},
) {
  return function (
    target: { constructor: new () => void },
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ): void {
    if (targetInstanceMap[target.constructor.name] === undefined) {
      targetInstanceMap[target.constructor.name] = new target.constructor();
    }
    if (subCommandRegister[target.constructor.name] === undefined) {
      subCommandRegister[target.constructor.name] = {};
    }
    subCommandRegister[target.constructor.name][name] = new SubCommandInfo(
      name,
      description,
      target[propertyKey],
      targetInstanceMap[target.constructor.name],
      options,
      parameterRegister[target.constructor.name][propertyKey],
    );
  };
}

export function CommandGroup(name: string, options: CommandOptions = {}) {
  return function (target: new () => unknown): void {
    if (commandRegister[target.name] === undefined) {
      commandRegister[target.name] = {};
    }

    if (commandAreaRegister[target.name] === undefined) {
      commandAreaRegister[target.name] = {};
    }

    rawCommandGroupRegister[name] = new CommandGroupInfo(
      name,
      options,
      commandRegister[target.name],
      commandAreaRegister[target.name],
    );
    setParentForChildren(
      rawCommandGroupRegister[name],
      rawCommandGroupRegister[name].commands,
    );
    setParentForChildren(
      rawCommandGroupRegister[name],
      rawCommandGroupRegister[name].commandAreas,
    );
  };
}
export function SubCommandGroup(
  commandArea: new () => unknown,
  name: string,
  description: string,
  options: CommandOptions = {},
) {
  return function (target: new () => unknown): void {
    if (subCommandGroupRegister[commandArea.name] === undefined) {
      subCommandGroupRegister[commandArea.name] = {};
    }

    if (subCommandRegister[target.name] === undefined) {
      subCommandRegister[target.name] = {};
    }
    subCommandGroupRegister[commandArea.name][name] = new SubCommandGroupInfo(
      name,
      description,
      options,
      subCommandRegister[target.name],
    );
    setParentForChildren(
      subCommandGroupRegister[commandArea.name][name],
      subCommandGroupRegister[commandArea.name][name].subCommands,
    );
    if (flatCommandAreaRegister()[commandArea.name]) {
      subCommandGroupRegister[commandArea.name][name].setParent(
        flatCommandAreaRegister()[commandArea.name],
      );
    }
  };
}

export function CommandArea(
  commandGroup: new () => unknown,
  name: string,
  description: string,
  options: CommandOptions = {},
) {
  return function (target: new () => unknown): void {
    const commandArea = commandAreaRegister[commandGroup.name] ?? {};
    if (commandAreaRegister[commandGroup.name] === undefined) {
      commandAreaRegister[commandGroup.name] = commandArea;
    }
    if (subCommandGroupRegister[target.name] === undefined) {
      subCommandGroupRegister[target.name] = {};
    }
    if (subCommandRegister[target.name] === undefined) {
      subCommandRegister[target.name] = {};
    }

    commandArea[name] = new CommandAreaInfo(
      name,
      description,
      options,
      subCommandRegister[target.name],
      subCommandGroupRegister[target.name],
    );
    setParentForChildren(commandArea[name], commandArea[name].subCommandGroups);
    setParentForChildren(commandArea[name], commandArea[name].subCommands);
    if (rawCommandGroupRegister[commandGroup.name]) {
      commandArea[name].setParent(rawCommandGroupRegister[commandGroup.name]);
    }
  };
}
