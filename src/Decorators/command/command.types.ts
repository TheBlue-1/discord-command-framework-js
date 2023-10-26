import type { PermissionsString } from "discord.js";
import type { CustomUnknown } from "../../types";
import type {
  InteractionAttribute,
  InteractionParameter,
} from "../parameter/parameter.types";

export interface CommandOptions {
  access?: AccessLevel;
  neededPermissions?: PermissionsString[];
}
export function mergeOptions(
  parent: CommandOptions,
  child: CommandOptions,
): CommandOptions {
  const options: CommandOptions = {};
  options.access = child.access ?? parent.access ?? "Everyone";
  options.neededPermissions = (parent.neededPermissions ?? []).concat(
    ...(child.neededPermissions ?? []),
  );
  return options;
}

export abstract class Configurable {
  protected parent?: Configurable;

  public constructor(
    public name: string,
    protected options: CommandOptions,
  ) {}

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
  public constructor(
    name: string,
    public description: string,
    options: CommandOptions,
  ) {
    super(name, options);
  }
}
export abstract class CallableCommandInfo extends DescribedConfigurable {
  public constructor(
    name: string,
    description: string,

    public callable: () => CustomUnknown | Promise<CustomUnknown>,
    public parentInstance: unknown,
    options: CommandOptions,
    public parameters: (InteractionAttribute | InteractionParameter)[],
  ) {
    super(name, description, options);
  }
}

export class CommandInfo extends CallableCommandInfo {
  public constructor(
    name: string,
    description: string,
    callable: () => CustomUnknown | Promise<CustomUnknown>,
    parentInstance: unknown,
    options: CommandOptions,
    parameters: (InteractionAttribute | InteractionParameter)[] = [],
  ) {
    super(name, description, callable, parentInstance, options, parameters);
  }
}

export class CommandAreaInfo extends DescribedConfigurable {
  public constructor(
    name: string,
    description: string,
    options: CommandOptions,
    public subCommands: Record<string, SubCommandInfo>,
    public subCommandGroups: Record<string, SubCommandGroupInfo>,
  ) {
    super(name, description, options);
  }
}

export class SubCommandInfo extends CallableCommandInfo {
  public constructor(
    name: string,
    description: string,
    callable: () => CustomUnknown | Promise<CustomUnknown>,
    parentInstance: unknown,
    options: CommandOptions,
    parameters: (InteractionAttribute | InteractionParameter)[] = [],
  ) {
    super(name, description, callable, parentInstance, options, parameters);
  }
}

export class SubCommandGroupInfo extends DescribedConfigurable {
  public constructor(
    name: string,
    description: string,
    options: CommandOptions,
    public subCommands: Record<string, SubCommandInfo> = {},
  ) {
    super(name, description, options);
  }
}
export class CommandGroupInfo extends Configurable {
  public constructor(
    name: string,
    options: CommandOptions,
    public commands: Record<string, CommandInfo>,
    public commandAreas: Record<string, CommandAreaInfo>,
  ) {
    super(name, options);
  }
}
export type AccessLevel = "BotAdmin" | "Everyone" | "GuildAdmin";
