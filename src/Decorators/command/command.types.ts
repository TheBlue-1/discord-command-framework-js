import { PermissionString } from "discord.js";
import {
  InteractionParameter,
  InteractionAttribute,
} from "../parameter/parameter.types";

export type CommandOptions = {
  access?: AccessLevel;
  neededPermissions?: PermissionString[];
};
export function mergeOptions(
  parent: CommandOptions,
  child: CommandOptions
): CommandOptions {
  const options: CommandOptions = {};
  options.access = child.access ?? parent.access ?? "Everyone";
  options.neededPermissions = (parent.neededPermissions ?? []).concat(
    ...(child.neededPermissions ?? [])
  );
  return options;
}

export abstract class Configurable {
  protected parent?: Configurable;

  constructor(public name: string, protected options: CommandOptions) {}

  public getOptions(): CommandOptions {
    return this.parent
      ? mergeOptions(this.parent.getOptions(), this.options)
      : this.options;
  }

  public setParent(parent: Configurable) {
    this.parent = parent;
  }
}
export abstract class DescribedConfigurable extends Configurable {
  constructor(
    name: string,
    public description: string,
    options: CommandOptions
  ) {
    super(name, options);
  }
}
export abstract class CallableCommand extends DescribedConfigurable {
  constructor(
    name: string,
    description: string,

    public callable: () => void,
    public parentInstance: any,
    options: CommandOptions,
    public parameters: (InteractionParameter | InteractionAttribute)[]
  ) {
    super(name, description, options);
  }
}

export class Command extends CallableCommand {
  constructor(
    name: string,
    description: string,
    callable: () => void,
    parentInstance: any,
    options: CommandOptions,
    parameters: (InteractionParameter | InteractionAttribute)[] = []
  ) {
    super(name, description, callable, parentInstance, options, parameters);
  }
}

export class CommandArea extends DescribedConfigurable {
  constructor(
    name: string,
    description: string,
    options: CommandOptions,
    public subCommands: { [name: string]: SubCommand },
    public subCommandGroups: { [name: string]: SubCommandGroup }
  ) {
    super(name, description, options);
  }
}

export class SubCommand extends CallableCommand {
  constructor(
    name: string,
    description: string,
    callable: () => void,
    parentInstance: any,
    options: CommandOptions,
    parameters: (InteractionParameter | InteractionAttribute)[] = []
  ) {
    super(name, description, callable, parentInstance, options, parameters);
  }
}

export class SubCommandGroup extends DescribedConfigurable {
  constructor(
    name: string,
    description: string,
    options: CommandOptions,
    public subCommands: { [name: string]: SubCommand } = {}
  ) {
    super(name, description, options);
  }
}
export class CommandGroup extends Configurable {
  constructor(
    name: string,
    options: CommandOptions,
    public commands: { [name: string]: Command },
    public commandAreas: { [name: string]: CommandArea }
  ) {
    super(name, options);
  }
}
export type AccessLevel = "Everyone" | "GuildAdmin" | "BotAdmin";
