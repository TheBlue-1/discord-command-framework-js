import {
  Client,
  type AutocompleteInteraction,
  type ClientEvents,
  type ClientOptions,
  type CommandInteraction,
  type Interaction,
} from "discord.js";
import deepEquals from "fast-deep-equal";
import { Observable, map, takeWhile } from "rxjs";
import {
  commandGroupRegister,
  type CommandGroupRegister,
} from "./Decorators/command/command.helpers";
import {
  handleObservableErrors,
  type ErrorHandlingObservable,
} from "./error-handling";
import { Interpreter } from "./interpreter";
import {
  SlashCommandGenerator,
  type SlashCommand,
} from "./slash-command-generator";

export class Bot {
  protected data:
    | {
        commandGroups: CommandGroupRegister;
        commandInteraction$: Observable<CommandInteraction>;
        createdInteraction$: Observable<Interaction>;
        autocompleteParameter$: Observable<AutocompleteInteraction>;
        interpreter: Interpreter;
        client: Client<true>;
      }
    | undefined = undefined;

  public get client() {
    if (!this.data) throw new Error("bot not started");
    return this.data.client;
  }

  public constructor(
    private readonly token: string,
    protected readonly options: ClientOptions = { intents: [] },
  ) {}

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
      (subscriber) => {
        this.client.on(event, (...params: ClientEvents[T]) => {
          if (params.length === 1) {
            subscriber.next(params[0]);
          } else subscriber.next(params);
        });
      },
    );
    return handleObservableErrors(observable);
  }

  public async start(): Promise<void> {
    console.log("bot preparing");
    const newClient = new Client(this.options);
    const commandGroups = commandGroupRegister();

    console.log("bot starting");

    const generator = new SlashCommandGenerator();
    const commands = generator.generate(commandGroups);

    const createdInteraction$ = this.listenTo("interactionCreate");
    const commandInteraction$ = createdInteraction$.pipe(
      takeWhile((i) => i.isCommand()),
      map((i) => i as CommandInteraction),
    );
    const interpreter = new Interpreter(commandInteraction$, commandGroups);

    const autocompleteParameter$ = createdInteraction$.pipe(
      takeWhile((i) => i.isAutocomplete()),
      map((i) => i as AutocompleteInteraction),
    );
    await this.client.login(this.token);
    console.log("bot online");
    await this.registerCommands(commands);
    console.log("commands registered");

    this.data = {
      client: newClient,
      commandGroups,
      commandInteraction$,

      createdInteraction$,
      autocompleteParameter$,
      interpreter,
    };
  }

  private async registerCommands(commands: SlashCommand[]) {
    const oldCommands = (await this.client.application.commands.fetch()).map(
      (c) => c,
    );

    const calls: Promise<unknown>[] = [];

    for (const command of commands) {
      let oldIndex;
      if (
        (oldIndex = oldCommands.findIndex((c) => c.name === command.name)) !==
        -1
      ) {
        calls.push(this.client.application.commands.create(command));
        continue;
      }
      const [oldCommand] = oldCommands.splice(oldIndex, 1);
      if (!oldCommand) throw new Error("impossible case reached");
      // TODO make sure oldCommand also has type as enum value
      if (deepEquals(command, oldCommand)) {
        continue;
      }
      calls.push(this.client.application.commands.edit(oldCommand, command));
    }

    for (const oldCommand of oldCommands) {
      calls.push(this.client.application.commands.delete(oldCommand));
    }

    await Promise.all(calls);
  }
}
