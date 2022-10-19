import {
  AutocompleteInteraction,
  Client,
  ClientEvents,
  ClientOptions,
  CommandInteraction,
  Interaction,
} from "discord.js";
import { map, Observable, takeWhile } from "rxjs";
import {
  CommandGroupRegister,
  commandGroupRegister,
} from "./Decorators/command/command.helpers";

import { handleObservableErrors } from "./error-handling";
import { Interpreter } from "./interpreter";
import { SlashCommand, SlashCommandGenerator } from "./slash-command-generator";

export class Bot {
  protected autocompleteParameter$: Observable<AutocompleteInteraction>;
  protected commandGroups: CommandGroupRegister;
  protected commandInteraction$: Observable<CommandInteraction>;
  protected createdInteraction$: Observable<Interaction>;
  protected interpreter: Interpreter;

  public client: Client;

  constructor(private token: string, options: ClientOptions = { intents: [] }) {
    this.client = new Client(options);
    this.commandGroups = commandGroupRegister();
  }

  public listenTo<T extends keyof ClientEvents>(
    event: T
  ): Observable<
    ClientEvents[T] extends { 1: unknown }
      ? ClientEvents[T]
      : ClientEvents[T][0]
  >;
  public listenTo<T extends keyof ClientEvents>(
    event: T
  ): Observable<ClientEvents[T] | ClientEvents[T][0]> {
    const observable: Observable<ClientEvents[T] | ClientEvents[T][0]> =
      new Observable((subscriber) => {
        this.client.on(event, (...params: ClientEvents[T]) => {
          if (params.length == 1) {
            subscriber.next(params[0]);
          } else subscriber.next(params);
        });
      });
    return handleObservableErrors(observable);
  }

  public async start(): Promise<void> {
    console.log("bot starting");

    const generator = new SlashCommandGenerator();
    const commands = generator.generate(this.commandGroups);

    this.createdInteraction$ = this.listenTo("interactionCreate");
    this.commandInteraction$ = this.createdInteraction$.pipe(
      takeWhile((i) => i.isCommand()),
      map((i) => i as CommandInteraction)
    );
    this.interpreter = new Interpreter(
      this.commandInteraction$,
      this.commandGroups
    );

    this.autocompleteParameter$ = this.createdInteraction$.pipe(
      takeWhile((i) => i.isAutocomplete()),
      map((i) => i as AutocompleteInteraction)
    );
    this.autocompleteParameter$.subscribe((s) => {
      s.respond([{ name: "a", value: "a" }]);
    });
    await this.client.login(this.token);
    console.log("bot online");
    await this.registerCommands(commands);
    console.log("commands registered");
  }

  private async registerCommands(commands: SlashCommand[]) {
    const oldCommands = (await this.client.application.commands.fetch()).map(
      (c) => c
    );

    for (const command of commands) {
      let oldIndex;
      if (
        (oldIndex = oldCommands.findIndex((c) => c.name == command.name)) != -1
      ) {
        this.client.application.commands.create(command);
        continue;
      }
      const [oldCommand] = oldCommands.splice(oldIndex, 1);
      if (command.deepEquals(oldCommand)) {
        continue;
      }
      this.client.application.commands.edit(oldCommand, command);
    }

    for (const oldCommand of oldCommands) {
      this.client.application.commands.delete(oldCommand);
    }
  }
}
