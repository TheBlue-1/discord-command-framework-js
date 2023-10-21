import { classDecorator, methodDecorator } from "../helpers";
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
  return methodDecorator((target, propertyKey) => {
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
    const subCommand = subCommandRegister[target.constructor.name] ?? {};
    if (subCommandRegister[target.constructor.name] === undefined) {
      subCommandRegister[target.constructor.name] = subCommand;
    }
    subCommand[name] = new SubCommandInfo(
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
    const command = commandRegister[target.name] ?? {};
    if (commandRegister[target.name] === undefined) {
      commandRegister[target.name] = command;
    }

    const commandArea = commandAreaRegister[target.name] ?? {};
    if (commandAreaRegister[target.name] === undefined) {
      commandAreaRegister[target.name] = commandArea;
    }

    const commandGroup = new CommandGroupInfo(
      name,
      options,
      command,
      commandArea,
    );
    rawCommandGroupRegister[name] = commandGroup;
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
    const subCommandGroup = subCommandGroupRegister[commandArea.name] ?? {};
    if (subCommandGroupRegister[commandArea.name] === undefined) {
      subCommandGroupRegister[commandArea.name] = subCommandGroup;
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
    subCommandGroup[name] = subCommandGroupInfo;
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
    const commandArea = commandAreaRegister[commandGroup.name] ?? {};
    if (commandAreaRegister[commandGroup.name] === undefined) {
      commandAreaRegister[commandGroup.name] = commandArea;
    }
    const subCommandGroup = subCommandGroupRegister[target.name] ?? {};
    if (subCommandGroupRegister[target.name] === undefined) {
      subCommandGroupRegister[target.name] = subCommandGroup;
    }
    const subCommand = subCommandRegister[target.name] ?? {};
    if (subCommandRegister[target.name] === undefined) {
      subCommandRegister[target.name] = subCommand;
    }

    const commandAreaInfo = new CommandAreaInfo(
      name,
      description,
      options,
      subCommand,
      subCommandGroup,
    );
    commandArea[name] = commandAreaInfo;
    setParentForChildren(commandAreaInfo, commandAreaInfo.subCommandGroups);
    setParentForChildren(commandAreaInfo, commandAreaInfo.subCommands);
    const parent = rawCommandGroupRegister[commandGroup.name];
    if (parent) {
      commandAreaInfo.setParent(parent);
    }
  });
}
