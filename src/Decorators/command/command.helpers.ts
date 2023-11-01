import type {
  CommandAreaInfo,
  CommandGroupInfo,
  CommandInfo,
  Configurable,
  SubCommandGroupInfo,
  SubCommandInfo,
} from "./command.types";

export type CommandGroupRegister = Record<string, CommandGroupInfo>;
export type ReadOnlyCommandGroupRegister = Readonly<
  Record<string, Readonly<CommandGroupInfo>>
>;

export const commandGroupRegister: CommandGroupRegister = {};
export const commandRegister: Record<string, Record<string, CommandInfo>> = {};
export const commandAreaRegister: Record<
  string,
  Record<string, CommandAreaInfo>
> = {};

export function flatCommandAreaRegister(): Record<string, CommandAreaInfo> {
  const commandAreas: Record<string, CommandAreaInfo> = {};
  for (const group of Object.values(commandAreaRegister)) {
    Object.assign(commandAreas, group);
  }
  return commandAreas;
}
export const subCommandRegister: Record<
  string,
  Record<string, SubCommandInfo>
> = {};
export const subCommandGroupRegister: Record<
  string,
  Record<string, SubCommandGroupInfo>
> = {};
export const targetInstanceMap: Record<string, unknown> = {};

export function setParentForChildren(
  parent: Readonly<Configurable>,
  children: Readonly<Record<string, Readonly<Configurable>>>,
) {
  for (const child of Object.values(children)) {
    child.setParent(parent);
  }
}
