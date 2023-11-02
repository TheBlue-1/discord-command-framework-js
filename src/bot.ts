import {
  Client,
  type ApplicationCommand,
  type AutocompleteInteraction,
  type ChatInputCommandInteraction,
  type ClientEvents,
  type ClientOptions,
  type GuildResolvable,
  type Interaction,
} from "discord.js";
import deepEquals from "fast-deep-equal";
import { Observable, map, takeWhile, type Subscriber } from "rxjs";
import { commandGroupRegister } from "./Decorators/command/command.helpers";
import {
  handleObservableErrors,
  type ErrorHandlingObservable,
} from "./error-handling";
import { Interpreter } from "./interpreter";
import {
  SlashCommandGenerator,
  type SlashCommand,
} from "./slash-command-generator";
import type { DeepReadonly } from "./types";

type ReadonlyApplicationCommand = DeepReadonly<
  ApplicationCommand<{
    guild: GuildResolvable;
  }>
>;
export class Bot {
  protected data:
    | {
        commandInteraction$: ErrorHandlingObservable<
          DeepReadonly<ChatInputCommandInteraction>
        >;
        createdInteraction$: ErrorHandlingObservable<Interaction>;
        autocompleteParameter$: ErrorHandlingObservable<AutocompleteInteraction>;
        interpreter: Interpreter;
      }
    | undefined = undefined;

  protected _client: Client;

  public get client(): Client<true> {
    if (!this._client.isReady()) throw new Error("bot not started");
    return this._client;
  }

  public constructor(
    private readonly token: string,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- discord wants a mutable object
    options: ClientOptions = { intents: [] },
  ) {
    this._client = new Client(options);
  }

  public listenTo<T extends keyof ClientEvents>(
    event: T,
  ): ErrorHandlingObservable<
    ClientEvents[T] extends { 1: unknown }
      ? ClientEvents[T]
      : ClientEvents[T][0]
  >;
  public listenTo<T extends keyof ClientEvents>(
    event: T,
  ): ErrorHandlingObservable<ClientEvents[T] | ClientEvents[T][0]> {
    const observable = new Observable<ClientEvents[T] | ClientEvents[T][0]>(
      (
        subscriber: Readonly<Subscriber<ClientEvents[T] | ClientEvents[T][0]>>,
      ) => {
        this._client.on(event, (...params: ClientEvents[T]) => {
          if (params.length === 1) {
            subscriber.next(params[0]);
          } else subscriber.next(params);
        });
      },
    );
    return handleObservableErrors(observable);
  }

  public async start(): Promise<void> {
    console.log("bot starting");

    const commands = SlashCommandGenerator.generate(commandGroupRegister);

    const createdInteraction$ = this.listenTo("interactionCreate");
    const commandInteraction$ = createdInteraction$.pipe(
      takeWhile((i: DeepReadonly<Interaction>) => i.isChatInputCommand()),
      map((i) => i as DeepReadonly<ChatInputCommandInteraction>),
    );
    const interpreter = new Interpreter(
      commandInteraction$,
      commandGroupRegister,
    );

    const autocompleteParameter$ = createdInteraction$.pipe(
      takeWhile((i) => i.isAutocomplete()),
      map((i) => i as DeepReadonly<AutocompleteInteraction>),
    );

    const onReady = new Promise((resolve, reject) => {
      this._client.once("ready", resolve);
      setTimeout(reject, 10000);
    });

    await this._client.login(this.token);
    await onReady;
    console.log("bot online");

    const registerInfo = await this.registerCommands(commands);
    console.log(
      `${registerInfo.count} commands registered (${registerInfo.created} created, ${registerInfo.edited} edited, ${registerInfo.removed} removed)`,
    );

    this.data = {
      commandInteraction$,
      createdInteraction$,
      autocompleteParameter$,
      interpreter,
    };
  }

  private async registerCommands(commands: readonly SlashCommand[]) {
    const oldCommands = [
      ...(await this.client.application.commands.fetch()).values(),
    ];

    const created: Promise<unknown>[] = [];
    const edited: Promise<unknown>[] = [];
    const removed: Promise<unknown>[] = [];

    for (const command of commands) {
      const oldIndex = oldCommands.findIndex(
        (c: ReadonlyApplicationCommand) => c.name === command.name,
      );
      if (oldIndex === -1) {
        created.push(this.client.application.commands.create(command));
        continue;
      }
      const [oldCommand] = oldCommands.splice(oldIndex, 1);
      if (!oldCommand) throw new Error("impossible case reached");

      if (deepEquals(command, oldCommand)) {
        continue;
      }
      edited.push(this.client.application.commands.edit(oldCommand, command));
    }

    for (const oldCommand of oldCommands) {
      removed.push(this.client.application.commands.delete(oldCommand));
    }

    await Promise.all([...created, ...edited, ...removed]);

    return {
      count: commands.length,
      created: created.length,
      edited: edited.length,
      removed: removed.length,
    };
  }
}
