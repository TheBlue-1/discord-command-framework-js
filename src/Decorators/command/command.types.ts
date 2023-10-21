import { PermissionString } from "discord.js";
import {
  InteractionAttribute,
  InteractionParameter,
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
export abstract class CallableCommandInfo extends DescribedConfigurable {
  constructor(
    name: string,
    description: string,

    public callable: (...params: any[]) => void,
    public parentInstance: any,
    options: CommandOptions,
    public parameters: (InteractionParameter | InteractionAttribute)[]
  ) {
    super(name, description, options);
  }
}

export class CommandInfo extends CallableCommandInfo {
  constructor(
    name: string,
    description: string,
    callable: (...params: any[]) => void,
    parentInstance: any,
    options: CommandOptions,
    parameters: (InteractionParameter | InteractionAttribute)[] = []
  ) {
    super(name, description, callable, parentInstance, options, parameters);
  }
}

export class CommandAreaInfo extends DescribedConfigurable {
  constructor(
    name: string,
    description: string,
    options: CommandOptions,
    public subCommands: { [name: string]: SubCommandInfo },
    public subCommandGroups: { [name: string]: SubCommandGroupInfo }
  ) {
    super(name, description, options);
  }
}

export class SubCommandInfo extends CallableCommandInfo {
  constructor(
    name: string,
    description: string,
    callable: (...params: any[]) => void,
    parentInstance: any,
    options: CommandOptions,
    parameters: (InteractionParameter | InteractionAttribute)[] = []
  ) {
    super(name, description, callable, parentInstance, options, parameters);
  }
}

export class SubCommandGroupInfo extends DescribedConfigurable {
  constructor(
    name: string,
    description: string,
    options: CommandOptions,
    public subCommands: { [name: string]: SubCommandInfo } = {}
  ) {
    super(name, description, options);
  }
}
export class CommandGroupInfo extends Configurable {
  constructor(
    name: string,
    options: CommandOptions,
    public commands: { [name: string]: CommandInfo },
    public commandAreas: { [name: string]: CommandAreaInfo }
  ) {
    super(name, options);
  }
}
export type AccessLevel = "Everyone" | "GuildAdmin" | "BotAdmin";
