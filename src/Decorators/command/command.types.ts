import type { PermissionsString } from "discord.js";
import type { CustomUnknown } from "../../types";
import type {
  InteractionAttribute,
  InteractionParameter,
} from "../parameter/parameter.types";

export interface CommandOptions {
  readonly access?: AccessLevel;
  readonly neededPermissions?: readonly PermissionsString[];
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
  protected parent?: Readonly<Configurable>;

  public constructor(
    public readonly name: string,
    protected readonly options: CommandOptions,
  ) {}

  public getOptions(): CommandOptions {
    return this.parent
      ? mergeOptions(this.parent.getOptions(), this.options)
      : this.options;
  }

  public setParent(parent: Readonly<Configurable>) {
    this.parent = parent;
  }
}
export abstract class DescribedConfigurable extends Configurable {
  public constructor(
    name: string,
    public readonly description: string,
    options: CommandOptions,
  ) {
    super(name, options);
  }
}
export abstract class CallableCommandInfo extends DescribedConfigurable {
  public constructor(
    name: string,
    description: string,

    public readonly callable: () => CustomUnknown | Promise<CustomUnknown>,
    public readonly parentInstance: unknown,
    options: CommandOptions,
    public readonly parameters: readonly (
      | InteractionAttribute
      | InteractionParameter
    )[],
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
    parameters: readonly (InteractionAttribute | InteractionParameter)[] = [],
  ) {
    super(name, description, callable, parentInstance, options, parameters);
  }
}

export class CommandAreaInfo extends DescribedConfigurable {
  public constructor(
    name: string,
    description: string,
    options: CommandOptions,
    public readonly subCommands: Readonly<
      Record<string, Readonly<SubCommandInfo>>
    >,
    public readonly subCommandGroups: Readonly<
      Record<string, Readonly<SubCommandGroupInfo>>
    >,
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
    parameters: readonly (InteractionAttribute | InteractionParameter)[] = [],
  ) {
    super(name, description, callable, parentInstance, options, parameters);
  }
}

export class SubCommandGroupInfo extends DescribedConfigurable {
  public constructor(
    name: string,
    description: string,
    options: CommandOptions,
    public readonly subCommands: Readonly<
      Record<string, Readonly<SubCommandInfo>>
    > = {},
  ) {
    super(name, description, options);
  }
}
export class CommandGroupInfo extends Configurable {
  public constructor(
    name: string,
    options: CommandOptions,
    public readonly commands: Readonly<Record<string, Readonly<CommandInfo>>>,
    public readonly commandAreas: Readonly<
      Record<string, Readonly<CommandAreaInfo>>
    >,
  ) {
    super(name, options);
  }
}
export type AccessLevel = "BotAdmin" | "Everyone" | "GuildAdmin";
