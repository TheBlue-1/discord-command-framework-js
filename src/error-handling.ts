import type { CommandInteraction } from "discord.js";
import { Observable, type Observer, type Subscription } from "rxjs";
import { SafeSubscriber, type Subscriber } from "rxjs/internal/Subscriber";
import { logger } from "./logger";
import type { DeepReadonly } from "./types";

// global error handling (before shutdown)

type GlobalErrorHandler = (
  exitCode?: number,
  signal?: string,
  exception?: Readonly<Error>,
  kill?: boolean,
) => boolean;

export const globalDefaultHandler: GlobalErrorHandler = (
  exitCode?: number,
  signal?: string,
  exception?: Readonly<Error>,
  kill?: boolean,
) => {
  logger.log(
    `Program is about to ${!(kill ?? false) ? "(NOT) " : ""}exit${
      exitCode === undefined ? "" : ` with code "${exitCode}"`
    }${signal === undefined ? "" : ` with signal "${signal}"`}${
      exception === undefined
        ? ""
        : ` with exception "${exception.message}" ${exception.stack}`
    }`,
  );
  return kill ?? false;
};
let currentGlobalErrorHandler: GlobalErrorHandler = globalDefaultHandler;

function globalHandler(
  exitCode?: number,
  signal?: string,
  exception?: Readonly<Error>,
  kill = true,
) {
  if (currentGlobalErrorHandler(exitCode, signal, exception, kill)) {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    removeGlobalErrorHandlers();
    process.kill(process.pid, signal);
  }
}

const globalHandlers = {
  sigInt: globalHandler.bind(undefined, undefined, "SIGINT", undefined),
  sigHup: globalHandler.bind(undefined, undefined, "SIGHUP", undefined),
  sigQuit: globalHandler.bind(undefined, undefined, "SIGQUIT", undefined),
  sigTerm: globalHandler.bind(undefined, undefined, "SIGTERM", undefined),
  sigUsr1: globalHandler.bind(undefined, undefined, "SIGUSR1", undefined),
  sigUsr2: globalHandler.bind(undefined, undefined, "SIGUSR2", undefined),
  uncaughtException: (e: Readonly<Error>) =>
    globalHandler.bind(undefined, undefined, undefined, e, false)(),
  exit: (code: number, signal: string) =>
    globalHandler.bind(undefined, code, signal, undefined, false)(),
};

export function initGlobalErrorHandlers(
  handler: GlobalErrorHandler = globalDefaultHandler,
): void {
  currentGlobalErrorHandler = handler;
  process.on("SIGINT", globalHandlers.sigInt);
  process.on("SIGHUP", globalHandlers.sigHup);
  process.on("SIGQUIT", globalHandlers.sigQuit);
  process.on("SIGTERM", globalHandlers.sigTerm);
  process.on("SIGUSR1", globalHandlers.sigUsr1);
  process.on("SIGUSR2", globalHandlers.sigUsr2);
  process.on("uncaughtException", globalHandlers.uncaughtException);
  process.on("exit", globalHandlers.exit);
}

export function removeGlobalErrorHandlers() {
  process.removeListener("SIGINT", globalHandlers.sigInt);
  process.removeListener("SIGHUP", globalHandlers.sigHup);
  process.removeListener("SIGQUIT", globalHandlers.sigQuit);
  process.removeListener("SIGTERM", globalHandlers.sigTerm);
  process.removeListener("SIGUSR1", globalHandlers.sigUsr1);
  process.removeListener("SIGUSR2", globalHandlers.sigUsr2);
  process.removeListener("uncaughtException", globalHandlers.uncaughtException);
  process.removeListener("exit", globalHandlers.exit);
}

// action error handling (just sends error message to user/logs)
export class BotError extends Error {
  public readonly errorType = "BOT_ERROR";

  public constructor(
    private readonly userMessage?: string,
    message: string | undefined = userMessage,
    public log: boolean | "WITH_STACK" = false,
  ) {
    super(message);
  }

  public override toString() {
    return this.userMessage ?? "an unknown error ocurred";
  }
}

function isCommandInteraction(val: unknown): val is CommandInteraction {
  return (
    typeof val === "object" &&
    val !== null &&
    "isCommand" in val &&
    typeof val.isCommand === "function" &&
    Boolean(val.isCommand())
  );
}

function isBotError(val: unknown): val is BotError {
  return (
    typeof val === "object" &&
    val !== null &&
    "errorType" in val &&
    val.errorType === "BOT_ERROR"
  );
}

export function errorHandler(error: unknown, args?: readonly unknown[]) {
  let interaction: CommandInteraction | undefined = undefined;
  const arg0 = args?.[0];
  if (isCommandInteraction(arg0)) {
    interaction = arg0;
  }

  if (isBotError(error)) {
    const botError: BotError = error;

    interaction?.reply(`${botError.message}`).catch(() => {
      logger.warn("couldn't reply after error");
    });

    if (botError.log !== false) {
      logger.warn(
        `An error occurred in a request: ${botError.message} (${
          botError.message
        })${botError.log === "WITH_STACK" ? `\n${botError.stack}` : ""}`,
      );
    }
  } else {
    logger.error(
      `An unknown error occurred in a request: ${String(error)}${
        typeof error === "object" && error && "stack" in error
          ? `\n${String(error.stack)}`
          : ""
      }`,
    );
    interaction?.reply("an unexpected error ocurred").catch(() => {
      logger.warn("couldn't reply after error");
    });
  }
}

export class ErrorHandlingSubscriber<T> extends SafeSubscriber<T> {
  public constructor(
    observerOrNext?:
      | Readonly<Partial<Observer<T>>>
      | ((value: T) => Promise<void> | void)
      | null,
    error?: ((error: unknown) => Promise<void> | void) | null,
    complete?: (() => Promise<void> | void) | null,
  ) {
    super();

    let next: ((value: T) => Promise<void>) | ((value: T) => void) | undefined;
    if (typeof observerOrNext === "function") {
      next = observerOrNext;
    } else if (observerOrNext) {
      ({ next, error, complete } = observerOrNext);
      const context = observerOrNext;

      next = next?.bind(context);
      error = error?.bind(context);
      complete = complete?.bind(context);
    }

    const noop = () => {
      // does nothing
    };
    const defaultErrorHandler = (err: unknown) => {
      throw err;
    };

    this.next = next
      ? ErrorHandlingSubscriber.wrapForErrorHandling(next)
      : noop;

    this.error = ErrorHandlingSubscriber.wrapForErrorHandling(
      error ?? defaultErrorHandler,
    );
    this.complete = complete
      ? ErrorHandlingSubscriber.wrapForErrorHandling(complete)
      : noop;
  }

  public static wrapForErrorHandling<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- generic function parameter
    T extends (...args: readonly any[]) => Promise<void> | void,
  >(handler: T) {
    return (...args: Parameters<T>) => {
      try {
        const res = handler(...args);
        if (res instanceof Promise) res.catch((err) => errorHandler(err, args));
      } catch (err) {
        setTimeout(() => errorHandler(err, args));
      }
    };
  }
}
export class ErrorHandlingObservable<T> extends Observable<DeepReadonly<T>> {
  public static fromObservable<T>(
    observable: DeepReadonly<Observable<T>>,
  ): ErrorHandlingObservable<T> {
    const errorHandlingObservable = new ErrorHandlingObservable(
      (subscriber: Readonly<Subscriber<unknown>>) => {
        observable.subscribe((value) => {
          subscriber.next(value);
        });
      },
    );
    return errorHandlingObservable as ErrorHandlingObservable<T>;
  }

  public override subscribe(
    observerOrNext?:
      | Readonly<Partial<Observer<DeepReadonly<T>>>>
      | ((value: DeepReadonly<T>) => Promise<void>)
      | ((value: DeepReadonly<T>) => void)
      | null,
    error?: ((error: unknown) => Promise<void> | void) | null,
    complete?: (() => Promise<void> | void) | null,
  ): Subscription {
    const subscriber = new ErrorHandlingSubscriber(
      observerOrNext,
      error,
      complete,
    );

    return super.subscribe(subscriber);
  }
}

export function handleObservableErrors<T>(
  observable: DeepReadonly<Observable<T>>,
): ErrorHandlingObservable<T> {
  return ErrorHandlingObservable.fromObservable(observable);
}
