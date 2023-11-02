import { classDecorator, methodDecorator } from "../helpers";
import { parameterRegister } from "../parameter/parameter.helpers";
import {
  commandAreaRegister,
  commandGroupRegister,
  commandRegister,
  flatCommandAreaRegister,
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
  return methodDecorator((target, propertyKey) => {
    const commands = commandRegister[target.constructor.name] ?? {};
    if (commandRegister[target.constructor.name] === undefined) {
      commandRegister[target.constructor.name] = commands;
    }
    const targetInstance =
      targetInstanceMap[target.constructor.name] ?? new target.constructor();
    if (targetInstanceMap[target.constructor.name] === undefined) {
      targetInstanceMap[target.constructor.name] = targetInstance;
    }

    commands[name] = new CommandInfo(
      name,
      description,
      target[propertyKey],
      targetInstanceMap[target.constructor.name],
      options,
      parameterRegister[target.constructor.name]?.[propertyKey],
    );
  });
}
export function SubCommand(
  name: string,
  description: string,
  options: CommandOptions = {},
) {
  return methodDecorator((target, propertyKey) => {
    if (targetInstanceMap[target.constructor.name] === undefined) {
      targetInstanceMap[target.constructor.name] = new target.constructor();
    }
    const subCommands = subCommandRegister[target.constructor.name] ?? {};
    if (subCommandRegister[target.constructor.name] === undefined) {
      subCommandRegister[target.constructor.name] = subCommands;
    }
    subCommands[name] = new SubCommandInfo(
      name,
      description,
      target[propertyKey],
      targetInstanceMap[target.constructor.name],
      options,
      parameterRegister[target.constructor.name]?.[propertyKey],
    );
  });
}

export function CommandGroup(name: string, options: CommandOptions = {}) {
  return classDecorator((target) => {
    const commands = commandRegister[target.name] ?? {};
    if (commandRegister[target.name] === undefined) {
      commandRegister[target.name] = commands;
    }

    const commandAreas = commandAreaRegister[target.name] ?? {};
    if (commandAreaRegister[target.name] === undefined) {
      commandAreaRegister[target.name] = commandAreas;
    }

    const commandGroup = new CommandGroupInfo(
      name,
      options,
      commands,
      commandAreas,
    );
    commandGroupRegister[name] = commandGroup;
    setParentForChildren(commandGroup, commandGroup.commands);
    setParentForChildren(commandGroup, commandGroup.commandAreas);
  });
}
export function SubCommandGroup(
  commandArea: new () => unknown,
  name: string,
  description: string,
  options: CommandOptions = {},
) {
  return classDecorator((target) => {
    const subCommandGroups = subCommandGroupRegister[commandArea.name] ?? {};
    if (subCommandGroupRegister[commandArea.name] === undefined) {
      subCommandGroupRegister[commandArea.name] = subCommandGroups;
    }

    if (subCommandRegister[target.name] === undefined) {
      subCommandRegister[target.name] = {};
    }
    const subCommandGroupInfo = new SubCommandGroupInfo(
      name,
      description,
      options,
      subCommandRegister[target.name],
    );
    subCommandGroups[name] = subCommandGroupInfo;
    setParentForChildren(subCommandGroupInfo, subCommandGroupInfo.subCommands);
    const parent = flatCommandAreaRegister()[commandArea.name];
    if (parent) {
      subCommandGroupInfo.setParent(parent);
    }
  });
}

export function CommandArea(
  commandGroup: new () => unknown,
  name: string,
  description: string,
  options: CommandOptions = {},
) {
  return classDecorator((target) => {
    const commandAreas = commandAreaRegister[commandGroup.name] ?? {};
    if (commandAreaRegister[commandGroup.name] === undefined) {
      commandAreaRegister[commandGroup.name] = commandAreas;
    }
    const subCommandGroups = subCommandGroupRegister[target.name] ?? {};
    if (subCommandGroupRegister[target.name] === undefined) {
      subCommandGroupRegister[target.name] = subCommandGroups;
    }
    const subCommands = subCommandRegister[target.name] ?? {};
    if (subCommandRegister[target.name] === undefined) {
      subCommandRegister[target.name] = subCommands;
    }

    const commandAreaInfo = new CommandAreaInfo(
      name,
      description,
      options,
      subCommands,
      subCommandGroups,
    );
    commandAreas[name] = commandAreaInfo;
    setParentForChildren(commandAreaInfo, commandAreaInfo.subCommandGroups);
    setParentForChildren(commandAreaInfo, commandAreaInfo.subCommands);
    const parent = commandGroupRegister[commandGroup.name];
    if (parent) {
      commandAreaInfo.setParent(parent);
    }
  });
}
